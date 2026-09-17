"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Navigation, Play, Pause, X, Clock, Calendar as CalendarIcon, User, SkipBack, MapPin, Battery } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ClientData } from "@/components/ClientDialog";

// Dynamic import with no SSR because Leaflet uses window object
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">Cargando mapa interactivo...</div>
});

interface Device {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string;
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

export default function MapaPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState("");
  
  // States for device selection and floating panel
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Playback states
  const [history, setHistory] = useState<Position[]>([]);
  const [playbackState, setPlaybackState] = useState<'playing' | 'paused' | 'rewinding'>('paused');
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // Velocidades: 1x, 2x, 4x, 8x, 16x

  // Fetch Initial Data
  useEffect(() => {
    fetch('/api/devices')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setDevices(data); })
      .catch(console.error);

    fetch('/api/positions')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setPositions(data); })
      .catch(console.error);

    fetch('/api/rutas')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setClients(data); })
      .catch(console.error);
      
    // Polling for live positions
    const interval = setInterval(() => {
      fetch('/api/positions')
        .then(res => res.json())
        .then(pos => {
          if (Array.isArray(pos)) setPositions(pos);
        })
        .catch(console.error);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute visits based on history and clients
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
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    };

    for (let index = 0; index < history.length; index++) {
      const pos = history[index];
      // Find if pos is inside any client geofence
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
              break; // assume one geofence at a time
            }
          }
        }
      }

      if (insideClient) {
        if (!currentVisit || currentVisit.client.id !== insideClient.id) {
          // If we were in another visit, close it
          if (currentVisit) {
            currentVisit.exitTime = pos.fixTime;
            computedVisits.push(currentVisit);
          }
          // Start new visit
          currentVisit = {
            client: insideClient,
            entryTime: pos.fixTime,
            exitTime: null,
            entryIndex: index
          };
        }
      } else {
        // If we were in a visit and stepped outside, close it
        if (currentVisit) {
          currentVisit.exitTime = pos.fixTime;
          computedVisits.push(currentVisit);
          currentVisit = null;
        }
      }
    }

    // Close the last visit if it was ongoing at the end of history
    if (currentVisit) {
      const lastPos = history[history.length - 1];
      (currentVisit as Visit).exitTime = lastPos.fixTime;
      computedVisits.push(currentVisit as Visit);
    }

    setVisits(computedVisits);
  }, [history, clients]);

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

  // Fetch History when a device or date is selected
  useEffect(() => {
    if (!selectedDeviceId || !selectedDate) {
      setHistory([]);
      setPlaybackIndex(0);
      setPlaybackState('paused');
      return;
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    // Use local time bounds for the selected date
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

  // Playback Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (playbackState !== 'paused' && history.length > 0) {
      // 500ms es la base (1x). Lo dividimos entre la velocidad seleccionada.
      const intervalMs = Math.max(50, 500 / playbackSpeed);
      timer = setInterval(() => {
        setPlaybackIndex(prev => {
          if (playbackState === 'playing') {
            if (prev >= history.length - 1) {
              setPlaybackState('paused');
              return prev;
            }
            return prev + 1;
          } else if (playbackState === 'rewinding') {
            if (prev <= 0) {
              setPlaybackState('paused');
              return 0;
            }
            return prev - 1;
          }
          return prev;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [playbackState, history.length, playbackSpeed]);

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.uniqueId.includes(search)
  );

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  const getDeviceName = (id: number) => {
    const device = devices.find(d => d.id === id);
    if (!device) return `Desconocido (${id})`;
    
    // Si el nombre oficial sigue siendo igual al ID numérico, intentamos buscar el nombre sugerido desde el celular
    if (device.name === device.uniqueId) {
      const latestPos = positions.find(p => p.deviceId === id);
      if (latestPos && latestPos.attributes && latestPos.attributes.vendedor) {
        return `${latestPos.attributes.vendedor} (Sugerido)`;
      }
    }
    
    return device.name;
  };

  const currentPlaybackPosition = history.length > 0 && playbackIndex < history.length ? history[playbackIndex] : null;

  // Calcular consumo de batería del historial
  let totalConsumedBattery: number | null = null;
  let startBatteryLevel: number | null = null;
  let endBatteryLevel: number | null = null;

  if (history.length > 0) {
    const firstPosWithBattery = history.find(p => p.attributes?.batteryLevel !== undefined);
    const lastPosWithBattery = history.slice().reverse().find(p => p.attributes?.batteryLevel !== undefined);
    
    if (firstPosWithBattery) startBatteryLevel = firstPosWithBattery.attributes.batteryLevel;
    if (lastPosWithBattery) endBatteryLevel = lastPosWithBattery.attributes.batteryLevel;

    let consumed = 0;
    let prevBattery = firstPosWithBattery ? firstPosWithBattery.attributes.batteryLevel : null;
    
    for (let i = 0; i < history.length; i++) {
      const currentBattery = history[i].attributes?.batteryLevel;
      if (currentBattery !== undefined && prevBattery !== null) {
        if (currentBattery < prevBattery) {
          consumed += (prevBattery - currentBattery);
        }
        prevBattery = currentBattery;
      } else if (currentBattery !== undefined) {
        prevBattery = currentBattery;
      }
    }
    if (startBatteryLevel !== null && endBatteryLevel !== null) {
      totalConsumedBattery = consumed;
    }
  }

  // Haversine formula para calcular distancia entre coordenadas (km)
  const calculateSpeedKmH = (currentIndex: number, historyArray: Position[]) => {
    // Si viene velocidad del GPS > 0, usar esa (Traccar la da en nudos)
    if (historyArray[currentIndex]?.speed && historyArray[currentIndex].speed > 1) {
      return historyArray[currentIndex].speed * 1.852; 
    }
    
    // De lo contrario calcularla manualmente usando el punto anterior
    if (currentIndex <= 0) return 0;
    
    const prev = historyArray[currentIndex - 1];
    const curr = historyArray[currentIndex];
    
    if (!prev || !curr || !prev.fixTime || !curr.fixTime) return 0;

    const R = 6371; // Radio de la Tierra en km
    const dLat = (curr.latitude - prev.latitude) * (Math.PI / 180);
    const dLon = (curr.longitude - prev.longitude) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(prev.latitude * (Math.PI / 180)) * Math.cos(curr.latitude * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distancia en km
    
    const timeDiffHours = (new Date(curr.fixTime).getTime() - new Date(prev.fixTime).getTime()) / (1000 * 60 * 60);
    
    // Evitar divisiones por cero o velocidades absurdas (>300kmh) por saltos de GPS
    if (timeDiffHours <= 0) return 0;
    const speed = distance / timeDiffHours;
    return speed > 300 ? 0 : speed;
  };

  const currentSpeed = currentPlaybackPosition ? calculateSpeedKmH(playbackIndex, history) : 0;

  // Parseamos selectedDate a un objeto Date real para el calendario
  const [year, month, day] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(year, month - 1, day);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden relative">
      
      {/* Sidebar Panel */}
      <aside className="w-80 flex-shrink-0 border-r bg-white flex flex-col z-10 shadow-lg relative">
        <div className="p-4 border-b bg-gray-900 text-white flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Tracking MNS</h1>
        </div>
        
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              type="search" 
              placeholder="Buscar dispositivos..." 
              className="pl-8 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 flex flex-col gap-1">
            {filteredDevices.map(device => {
              const isSelected = selectedDeviceId === device.id;
              const displayName = getDeviceName(device.id);
              
              return (
                <div 
                  key={device.id}
                  onClick={() => setSelectedDeviceId(isSelected ? null : device.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{displayName}</span>
                    <Badge variant={device.status === 'online' ? 'default' : 'secondary'} className={`text-[10px] px-1.5 py-0 ${device.status === 'online' ? 'bg-green-500' : ''}`}>
                      {device.status === 'online' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    ID: {device.uniqueId}
                  </div>
                </div>
              )
            })}
            
            {filteredDevices.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No se encontraron dispositivos.
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Map Area */}
      <main className="flex-1 relative bg-gray-200">
        <MapComponent 
          positions={positions} 
          history={history} 
          selectedDeviceId={selectedDeviceId}
          clients={clients}
          getDeviceName={getDeviceName}
          playbackIndex={playbackIndex}
          onMarkerClick={(id) => setSelectedDeviceId(id)}
        />

        {/* Floating Panel for Device Details & Playback */}
        {selectedDevice && (
          <div className="absolute top-0 left-0 bottom-0 w-80 bg-white/95 backdrop-blur-md shadow-2xl z-[1000] flex flex-col border-r border-gray-200 animate-in slide-in-from-left duration-300">
            {/* Header Flotante */}
            <div className="p-4 border-b bg-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <User className="h-5 w-5 text-blue-600" />
                {selectedDevice.name}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDeviceId(null)} className="h-8 w-8 rounded-full hover:bg-gray-200">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Info del Vendedor */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Información Actual</h3>
                  <div className="bg-white p-3 rounded-lg border shadow-sm text-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Estado</span>
                      <Badge variant={selectedDevice.status === 'online' ? 'default' : 'secondary'} className={selectedDevice.status === 'online' ? 'bg-green-500' : ''}>
                        {selectedDevice.status === 'online' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">ID de Rastreo</span>
                      <span className="font-mono">{selectedDevice.uniqueId}</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-2 pt-2 border-t">
                      <span className="text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Última conexión</span>
                      <span className="font-medium text-gray-800">
                        {selectedDevice.lastUpdate ? new Date(selectedDevice.lastUpdate).toLocaleString() : 'Desconocida'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Historial y Calendario */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Repetición de Ruta</h3>
                  <div className="bg-white p-3 rounded-lg border shadow-sm text-sm">
                    <label className="text-gray-500 flex items-center gap-1 mb-1">
                      <CalendarIcon className="h-4 w-4" /> Fecha a consultar
                    </label>
                    
                    <div className="bg-white rounded-md border shadow-sm mb-3 flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDateObj}
                        onSelect={(date) => {
                          if (date) {
                            const offset = date.getTimezoneOffset();
                            const localDate = new Date(date.getTime() - (offset*60*1000));
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
                    </div>
                    
                    <div className="text-center text-gray-600 bg-gray-50 p-2 rounded mb-2">
                      Puntos registrados: <strong>{history.length}</strong>
                    </div>

                    {totalConsumedBattery !== null && startBatteryLevel !== null && endBatteryLevel !== null && (
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded text-center">
                        <div className="text-xs uppercase text-blue-800 font-bold mb-1 flex items-center justify-center gap-1">
                          <Battery className="h-3 w-3" /> Consumo de Batería
                        </div>
                        <p className="text-lg font-medium text-blue-600">
                          {totalConsumedBattery}% consumido
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          Inicio: {startBatteryLevel}% → Final: {endBatteryLevel}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Reproductor Flotante en la base del panel */}
            {history.length > 0 && (
              <div className="p-4 bg-gray-900 text-white shadow-[0_-10px_20px_rgba(0,0,0,0.1)] border-t border-gray-700">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{playbackIndex + 1} / {history.length}</span>
                    <span>{currentSpeed.toFixed(1)} km/h</span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="0" 
                    max={history.length - 1} 
                    value={playbackIndex}
                    onChange={(e) => {
                      setPlaybackIndex(parseInt(e.target.value));
                      setPlaybackState('paused');
                    }}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-1">
                      {/* Botón Rebobinar (Play hacia atrás) */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${playbackState === 'rewinding' ? 'text-blue-400 bg-gray-800' : 'text-white hover:bg-gray-800'}`}
                        onClick={() => {
                          if (playbackState === 'rewinding') {
                            setPlaybackState('paused');
                          } else {
                            if (playbackIndex <= 0) {
                              setPlaybackIndex(history.length - 1);
                            }
                            setPlaybackState('rewinding');
                          }
                        }}
                        title="Reproducir en reversa"
                      >
                        <SkipBack className="h-4 w-4 fill-current" />
                      </Button>
                      
                      {/* Botón Play/Pausa */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${playbackState === 'playing' ? 'text-blue-400 bg-gray-800' : 'text-white hover:bg-gray-800'}`}
                        onClick={() => {
                          if (playbackState === 'playing') {
                            setPlaybackState('paused');
                          } else {
                            if (playbackIndex >= history.length - 1) {
                              setPlaybackIndex(0);
                            }
                            setPlaybackState('playing');
                          }
                        }}
                        title="Reproducir hacia adelante"
                      >
                        {playbackState === 'playing' ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                      </Button>
                      
                      {/* Selector de Velocidad */}
                      <Button 
                        variant="ghost" 
                        className="text-blue-400 hover:text-blue-300 hover:bg-gray-800 h-8 px-2 text-xs font-bold transition-colors"
                        onClick={() => {
                          const speeds = [1, 2, 4, 8, 16];
                          const currentIndex = speeds.indexOf(playbackSpeed);
                          const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
                          setPlaybackSpeed(nextSpeed);
                        }}
                        title="Velocidad de reproducción"
                      >
                        {playbackSpeed}x
                      </Button>
                    </div>
                    
                    {/* Fecha y Hora seguras sin 'Invalid Date' */}
                    <div className="text-right text-xs">
                      <div className="font-semibold text-blue-300">
                        {currentPlaybackPosition?.fixTime ? new Date(currentPlaybackPosition.fixTime).toLocaleTimeString() : '--:--:--'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {currentPlaybackPosition?.fixTime ? new Date(currentPlaybackPosition.fixTime).toLocaleDateString() : 'Cargando...'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PANEL LATERAL DERECHO (TIMELINE DE VISITAS) --- */}
        {selectedDevice && (
          <div className="absolute top-4 right-4 z-10 w-80 bg-white/95 backdrop-blur rounded-xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden border border-gray-200 animate-in slide-in-from-right-8">
            <div className="p-4 border-b bg-gray-100/80">
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Resumen de Ruta
              </h2>
              <p className="text-xs text-gray-500 mt-1">Fecha: {format(selectedDateObj || new Date(), "dd/MM/yyyy")}</p>
            </div>
            
            <ScrollArea className="flex-1 p-0">
              {visits.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No se registraron visitas a clientes en este día.
                </div>
              ) : (
                <div className="flex flex-col relative p-4">
                  {/* Línea vertical de tiempo */}
                  <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200 z-0"></div>
                  
                  {visits.map((visit, i) => (
                    <div 
                      key={i} 
                      className="relative z-10 flex gap-4 mb-6 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => {
                        setPlaybackIndex(visit.entryIndex);
                        setPlaybackState('paused');
                        // Aquí idealmente volaríamos al mapa, lo cual haremos pasando un prop o usando un estado global, 
                        // pero por ahora el cambio de playbackIndex forzará al mapa a centrarse en el vendedor que estará en ese cliente.
                      }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {visit.client.attributes?.imageUrl ? (
                          <img src={visit.client.attributes.imageUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" alt="client" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold">
                            {visit.client.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">{visit.client.name}</h4>
                        {visit.client.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{visit.client.description}</p>
                        )}
                        <div className="mt-2 pl-3 border-l-2 border-gray-300 flex flex-col gap-0.5 text-xs text-gray-600 font-medium">
                          <span className="flex items-center gap-1">
                            Llegada: {new Date(visit.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            Salida: {visit.exitTime ? new Date(visit.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

      </main>
    </div>
  );
}
