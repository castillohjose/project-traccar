"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, MapPin, Calendar as CalendarIcon, List } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClientData } from "@/components/ClientDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-sm">Cargando mapa...</div>
});

interface Device {
  id: number;
  name: string;
  uniqueId: string;
}

interface Position {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number;
  fixTime: string;
  attributes?: any;
}

export interface Visit {
  client: ClientData;
  entryTime: string;
  exitTime: string | null;
  entryIndex: number;
}

export default function MapaMovilPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeDates, setActiveDates] = useState<string[]>([]);
  
  const [history, setHistory] = useState<Position[]>([]);
  const [playbackState, setPlaybackState] = useState<'playing' | 'paused' | 'rewinding'>('paused');
  const [playbackIndex, setPlaybackIndex] = useState(0);
  
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    fetch('/api/devices').then(res => res.json()).then(data => { if (Array.isArray(data)) setDevices(data); }).catch(console.error);
    fetch('/api/positions').then(res => res.json()).then(data => { if (Array.isArray(data)) setPositions(data); }).catch(console.error);
    fetch('/api/rutas').then(res => res.json()).then(data => { if (Array.isArray(data)) setClients(data); }).catch(console.error);
  }, []);

  // Fetch Active Dates for the selected device
  useEffect(() => {
    if (!selectedDeviceId) {
      setActiveDates([]);
      return;
    }
    fetch(`/api/active-dates?deviceId=${selectedDeviceId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setActiveDates(data);
      })
      .catch(console.error);
  }, [selectedDeviceId]);

  useEffect(() => {
    if (history.length === 0 || clients.length === 0) {
      setVisits([]);
      return;
    }
    const computedVisits: Visit[] = [];
    let currentVisit: Visit | null = null;
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3;
      const dLat = (lat2-lat1) * Math.PI/180;
      const dLon = (lon2-lon1) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    };
    for (let index = 0; index < history.length; index++) {
      const pos = history[index];
      let insideClient: ClientData | null = null;
      for (const client of clients) {
        if (client.area && client.area.startsWith("CIRCLE")) {
          const match = client.area.match(/CIRCLE \(([^ ]+) ([^,]+), ([^)]+)\)/);
          if (match) {
            const cLat = parseFloat(match[1]);
            const cLng = parseFloat(match[2]);
            const cRad = parseFloat(match[3]);
            if (getDistance(pos.latitude, pos.longitude, cLat, cLng) <= cRad) {
              insideClient = client;
              break; 
            }
          }
        }
      }
      if (insideClient) {
        if (!currentVisit || currentVisit.client.id !== insideClient.id) {
          if (currentVisit) {
            currentVisit.exitTime = pos.fixTime;
            computedVisits.push(currentVisit);
          }
          currentVisit = { client: insideClient, entryTime: pos.fixTime, exitTime: null, entryIndex: index };
        }
      } else {
        if (currentVisit) {
          currentVisit.exitTime = pos.fixTime;
          computedVisits.push(currentVisit);
          currentVisit = null;
        }
      }
    }
    if (currentVisit) {
      const lastPos = history[history.length - 1];
      (currentVisit as Visit).exitTime = lastPos.fixTime;
      computedVisits.push(currentVisit as Visit);
    }
    setVisits(computedVisits);
  }, [history, clients]);

  useEffect(() => {
    if (!selectedDeviceId || !selectedDate) {
      setHistory([]);
      setPlaybackIndex(0);
      setPlaybackState('paused');
      return;
    }
    const [year, month, day] = selectedDate.split('-').map(Number);
    const from = new Date(year, month - 1, day, 0, 0, 0);
    const to = new Date(year, month - 1, day, 23, 59, 59);
    
    fetch(`/api/positions?deviceId=${selectedDeviceId}&from=${from.toISOString()}&to=${to.toISOString()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
          setPlaybackIndex(0);
          setPlaybackState('paused');
        }
      })
      .catch(console.error);
  }, [selectedDeviceId, selectedDate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (playbackState !== 'paused' && history.length > 0) {
      timer = setInterval(() => {
        setPlaybackIndex(prev => {
          if (playbackState === 'playing') {
            if (prev >= history.length - 1) { setPlaybackState('paused'); return prev; }
            return prev + 1;
          } else if (playbackState === 'rewinding') {
            if (prev <= 0) { setPlaybackState('paused'); return 0; }
            return prev - 1;
          }
          return prev;
        });
      }, 100); // Fijo rápido para móvil
    }
    return () => clearInterval(timer);
  }, [playbackState, history.length]);

  const getDeviceName = (id: number) => {
    const device = devices.find(d => d.id === id);
    if (!device) return `Desconocido`;
    if (device.name === device.uniqueId) {
      const latestPos = positions.find(p => p.deviceId === id);
      if (latestPos?.attributes?.vendedor) return `${latestPos.attributes.vendedor}`;
    }
    return device.name;
  };

  const currentPlaybackPosition = history.length > 0 && playbackIndex < history.length ? history[playbackIndex] : null;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-100 overflow-hidden relative">
      
      {/* Timeline Desplegable (Visitas) AHORA ARRIBA */}
      {showTimeline && visits.length > 0 && (
        <div className="absolute top-4 left-2 right-2 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-[1000] border max-h-[30vh] flex flex-col animate-in slide-in-from-top-4 overflow-hidden">
          <div className="p-3 border-b bg-gray-50/80 flex justify-between items-center rounded-t-xl shrink-0">
            <span className="font-bold text-sm text-gray-700">Visitas a Clientes</span>
            <span className="text-xs text-gray-400">{visits.length} registradas</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 overscroll-contain">
            {visits.map((visit, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-2 border-b last:border-0 hover:bg-gray-50 active:bg-gray-100"
                onClick={() => {
                  setPlaybackIndex(visit.entryIndex);
                  setPlaybackState('paused');
                  setShowTimeline(false);
                }}
              >
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                  {visit.client.attributes?.imageUrl ? (
                    <img src={visit.client.attributes.imageUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" alt={visit.client.name} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold text-sm">
                      {visit.client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 truncate leading-tight">{visit.client.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                    {new Date(visit.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                    {visit.exitTime ? new Date(visit.exitTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mapa */}
      <main className="flex-1 relative z-0">
        <MapComponent 
          positions={positions} 
          history={history} 
          selectedDeviceId={selectedDeviceId ? parseInt(selectedDeviceId) : null}
          clients={clients}
          getDeviceName={getDeviceName}
          playbackIndex={playbackIndex}
          onMarkerClick={() => {}}
        />
      </main>

      {/* Contenedor Inferior: Selector de Vendedor, Calendario y Reproductor */}
      <div className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-10px_25px_rgba(0,0,0,0.1)] z-[1000] rounded-t-2xl pb-safe border-t">
        
        {/* Fila de Controles Superior: Selector + Botones */}
        <div className="p-3 flex gap-2 border-b bg-gray-50/50 rounded-t-2xl items-center">
          <div className="flex-1">
            <Select value={selectedDeviceId} onValueChange={(val) => setSelectedDeviceId(val || "")}>
              <SelectTrigger className="w-full bg-white font-bold h-10 shadow-sm border-gray-200">
                <SelectValue placeholder="Seleccionar Vendedor..." />
              </SelectTrigger>
              <SelectContent side="top" sideOffset={15} className="z-[99999] max-h-[35vh] bg-white border shadow-xl">
                {devices.map(d => (
                  <SelectItem key={d.id} value={d.id.toString()}>{getDeviceName(d.id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Popover>
            <PopoverTrigger className="h-10 w-10 bg-white flex items-center justify-center rounded-md border shadow-sm hover:bg-gray-50 transition-colors shrink-0">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 mb-2 z-[9999]" align="end" side="top" sideOffset={8}>
              <Calendar
                mode="single"
                selected={new Date(selectedDate + 'T00:00:00')}
                onSelect={(d) => {
                  if (d) {
                    const offset = d.getTimezoneOffset();
                    const localDate = new Date(d.getTime() - (offset*60*1000));
                    setSelectedDate(localDate.toISOString().split('T')[0]);
                  }
                }}
                locale={es}
                modifiers={{
                  active: activeDates.map(dateStr => {
                    const [y, m, d] = dateStr.split('-').map(Number);
                    return new Date(y, m - 1, d);
                  })
                }}
                modifiersClassNames={{
                  active: "bg-blue-100 text-blue-900 font-bold underline decoration-blue-500 underline-offset-4"
                }}
              />
            </PopoverContent>
          </Popover>

          {history.length > 0 && (
            <Button 
              variant="outline" 
              size="icon" 
              className={`h-10 w-10 shrink-0 shadow-sm transition-colors ${showTimeline ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white text-blue-600'}`} 
              onClick={() => setShowTimeline(!showTimeline)}
            >
              <List className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Reproductor Base (Si hay historial) */}
        {history.length > 0 ? (
          <div className="p-3">
            <input 
              type="range" 
              min="0" 
              max={history.length - 1} 
              value={playbackIndex}
              onChange={(e) => {
                setPlaybackIndex(parseInt(e.target.value));
                setPlaybackState('paused');
              }}
              className="w-full accent-blue-600 mb-3"
            />
            <div className="flex justify-between items-center px-1">
              <div className="flex gap-2">
                <Button size="icon" variant="outline" className="h-10 w-10 rounded-full border-gray-200 shadow-sm" onClick={() => {
                  if (playbackState === 'rewinding') setPlaybackState('paused');
                  else setPlaybackState('rewinding');
                }}>
                  <SkipBack className={`h-4 w-4 ${playbackState === 'rewinding' ? 'text-blue-600 fill-blue-600' : 'text-gray-700'}`} />
                </Button>
                <Button size="icon" className="h-10 w-10 rounded-full bg-blue-600 shadow-md hover:bg-blue-700" onClick={() => {
                  if (playbackState === 'playing') setPlaybackState('paused');
                  else setPlaybackState('playing');
                }}>
                  {playbackState === 'playing' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                </Button>
              </div>
              
              <div className="text-right flex flex-col items-end">
                <Badge variant="outline" className="text-[10px] font-mono bg-blue-50 text-blue-700 border-blue-100 mb-1">
                  {playbackIndex + 1} / {history.length}
                </Badge>
                <div className="text-sm font-bold text-gray-800">
                  {currentPlaybackPosition?.fixTime ? new Date(currentPlaybackPosition.fixTime).toLocaleTimeString() : '--:--'}
                </div>
              </div>
            </div>
          </div>
        ) : selectedDeviceId ? (
          <div className="p-4 text-center text-sm text-gray-500 font-medium">
            No hay puntos registrados en esta fecha.
          </div>
        ) : null}
      </div>
    </div>
  );
}
