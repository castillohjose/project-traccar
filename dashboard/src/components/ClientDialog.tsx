"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardPaste } from "lucide-react";

// Load map dynamically to avoid SSR window errors
const LocationPicker = dynamic(() => import("@/components/ClientLocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full flex items-center justify-center bg-gray-100 border rounded-md">Cargando mapa...</div>
});

export interface ClientData {
  id?: number;
  name: string;
  description: string;
  area: string;
  attributes: {
    imageUrl?: string;
  };
}

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientData | null;
  onSaved: () => void;
}

export function ClientDialog({ open, onOpenChange, client, onSaved }: ClientDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [radius, setRadius] = useState(500);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setName(client.name || "");
      setDescription(client.description || "");
      setImageUrl(client.attributes?.imageUrl || "");
      
      // Parse area "CIRCLE (lat lon, radius)"
      if (client.area && client.area.startsWith("CIRCLE")) {
        const match = client.area.match(/CIRCLE \(([^ ]+) ([^,]+), ([^)]+)\)/);
        if (match) {
          setLatitude(parseFloat(match[1]));
          setLongitude(parseFloat(match[2]));
          setRadius(parseFloat(match[3]));
        }
      }
    } else {
      setName("");
      setDescription("");
      setImageUrl("");
      setLatitude(0);
      setLongitude(0);
      setRadius(500);
    }
  }, [client, open]);

  const handleSave = async () => {
    if (!name || latitude === 0 || longitude === 0 || radius <= 0) {
      alert("Por favor completa el nombre y selecciona una ubicación en el mapa.");
      return;
    }

    setSaving(true);
    try {
      const payload: ClientData = {
        ...(client?.id ? { id: client.id } : {}),
        name,
        description,
        area: `CIRCLE (${latitude} ${longitude}, ${radius})`,
        attributes: {
          imageUrl: imageUrl || undefined
        }
      };

      const url = client?.id ? `/api/rutas/${client.id}` : '/api/rutas';
      const method = client?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al guardar el cliente');

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar el cliente");
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      
      // Intentar parsear el formato "lat, lng" o "lat lng" o similares
      // Regex que busca dos números con punto decimal separados por coma o espacio
      const match = text.match(/(-?\d+\.\d+)(?:\s*,\s*|\s+)(-?\d+\.\d+)/);
      
      if (match) {
        setLatitude(parseFloat(match[1]));
        setLongitude(parseFloat(match[2]));
      } else {
        alert("El texto del portapapeles no parece tener un formato de coordenadas válido (Ej: 10.047, -67.514)");
      }
    } catch (error) {
      console.error("Error al leer el portapapeles:", error);
      alert("No se pudo leer el portapapeles. Asegúrate de dar permisos o pégalo manualmente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente / Ruta' : 'Añadir Nuevo Cliente / Ruta'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Ej: Farmatodo Las Delicias" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descripción</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Ej: Dirección o detalles extra" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image" className="text-right">URL Imagen</Label>
            <Input id="image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" placeholder="https://ejemplo.com/logo.png" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="radius" className="text-right">Radio (metros)</Label>
            <Input id="radius" type="number" min={10} max={10000} value={radius} onChange={(e) => setRadius(parseInt(e.target.value) || 0)} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Coordenadas</Label>
            <div className="col-span-3 flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePaste}
                title="Pegar desde el portapapeles"
                className="shrink-0"
              >
                <ClipboardPaste className="h-4 w-4" />
              </Button>
              <Input 
                type="number" 
                step="any" 
                placeholder="Latitud (ej: 10.2312)" 
                value={latitude === 0 ? '' : latitude} 
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)} 
              />
              <Input 
                type="number" 
                step="any" 
                placeholder="Longitud (ej: -67.242)" 
                value={longitude === 0 ? '' : longitude} 
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)} 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <Label>Ubicación (También puedes hacer clic en el mapa para colocar el pin)</Label>
            <LocationPicker 
              latitude={latitude} 
              longitude={longitude} 
              radius={radius}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }} 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cliente'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
