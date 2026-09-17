"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet icon setup
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

interface ClientLocationPickerProps {
  latitude: number;
  longitude: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, radius, onChange }: { lat: number, lng: number, radius: number, onChange: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.flyTo([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);

  if (lat === 0 && lng === 0) return null;

  return (
    <>
      <Marker position={[lat, lng]} icon={icon} />
      <Circle center={[lat, lng]} radius={radius} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }} />
    </>
  );
}

export default function ClientLocationPicker({ latitude, longitude, radius, onChange }: ClientLocationPickerProps) {
  // Use Maracay as default center if no coordinates
  const defaultCenter: [number, number] = latitude !== 0 ? [latitude, longitude] : [10.231, -67.242];

  return (
    <div className="h-[300px] w-full rounded-md border overflow-hidden">
      <MapContainer 
        center={defaultCenter} 
        zoom={latitude !== 0 ? 15 : 12} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google Calles">
            <TileLayer
              attribution='&copy; Google'
              url="http://mt0.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Google Híbrido (Satélite)">
            <TileLayer
              attribution='&copy; Google'
              url="http://mt0.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <LocationMarker lat={latitude} lng={longitude} radius={radius} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
