"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Icono especial rojo para la repetición de la ruta
const playbackIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Position {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number;
  fixTime: string;
}

interface MapProps {
  positions: Position[];
  history: Position[];
  selectedDeviceId: number | null;
  getDeviceName: (id: number) => string;
  playbackIndex?: number;
  onMarkerClick?: (id: number) => void;
}

// Componente auxiliar para auto-centrar el mapa durante la reproducción
function MapPanController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 0.5 });
  }, [center, map]);
  return null;
}

export default function MapComponent({ positions, history, selectedDeviceId, getDeviceName, playbackIndex = 0, onMarkerClick }: MapProps) {
  let center: [number, number] = [10.4806, -66.9036]; // Default Caracas
  let panCenter: [number, number] | null = null;
  
  // Si estamos en repetición de historial (playback)
  if (selectedDeviceId && history.length > 0 && playbackIndex < history.length) {
    const p = history[playbackIndex];
    center = [p.latitude, p.longitude];
    panCenter = center; // Forzamos paneo suave
  } else {
    // Si no hay historial pero hay posición actual
    const selectedPos = positions.find(p => p.deviceId === selectedDeviceId);
    if (selectedPos) {
      center = [selectedPos.latitude, selectedPos.longitude];
      panCenter = center;
    } else if (positions.length > 0) {
      center = [positions[0].latitude, positions[0].longitude];
    }
  }

  // Extract coordinates for the polyline of the selected device's history
  const polylineCoords: [number, number][] = history.map(h => [h.latitude, h.longitude]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={14} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Controlador para mover la cámara dinámicamente si estamos reproduciendo una ruta */}
        {panCenter && <MapPanController center={panCenter} />}

        {/* Dibujar la línea de la ruta pasada */}
        {polylineCoords.length > 0 && (
          <Polyline positions={polylineCoords} color="#3b82f6" weight={5} opacity={0.6} />
        )}

        {/* Marcador especial móvil para la repetición de la ruta */}
        {selectedDeviceId && history.length > 0 && playbackIndex < history.length && (
          <Marker 
            position={[history[playbackIndex].latitude, history[playbackIndex].longitude]}
            icon={playbackIcon}
            zIndexOffset={1000} // Asegurar que quede por encima de los demás
          >
            <Popup>
              <strong>{getDeviceName(selectedDeviceId)} (Historial)</strong><br />
              Velocidad: {(history[playbackIndex].speed * 1.852).toFixed(1)} km/h<br />
              Hora: {new Date(history[playbackIndex].fixTime).toLocaleTimeString()}
            </Popup>
          </Marker>
        )}

        {/* Dibujar los vendedores activos a tiempo real (ocultar si estamos viendo historial del seleccionado para no confundir) */}
        {positions.map(pos => {
          // Si estamos viendo el historial de ESTE dispositivo, ocultamos su pin estático de tiempo real
          if (selectedDeviceId === pos.deviceId && history.length > 0) return null;

          return (
            <Marker 
              key={pos.id} 
              position={[pos.latitude, pos.longitude]} 
              icon={icon}
              opacity={selectedDeviceId === null || selectedDeviceId === pos.deviceId ? 1 : 0.5}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) onMarkerClick(pos.deviceId);
                }
              }}
            >
              <Popup>
                <strong>{getDeviceName(pos.deviceId)}</strong><br />
                Velocidad: {(pos.speed * 1.852).toFixed(1)} km/h<br />
                Última act: {new Date(pos.fixtime || new Date()).toLocaleTimeString()}
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  );
}
