"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Navigation, Play, Pause, X, Clock, Calendar as CalendarIcon, User, SkipBack } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
}

export default function MapaPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState("");
  
  // States for device selection and floating panel
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
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
                    <Input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="mb-3"
                    />
                    
                    <div className="text-center text-gray-600 bg-gray-50 p-2 rounded">
                      Puntos registrados: <strong>{history.length}</strong>
                    </div>
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
      </main>
      
    </div>
  );
}
