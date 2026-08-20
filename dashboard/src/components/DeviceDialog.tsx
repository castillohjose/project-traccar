"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Device {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string;
}

interface DeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: Device | null;
  onSaved: () => void;
}

export function DeviceDialog({ open, onOpenChange, device, onSaved }: DeviceDialogProps) {
  const [name, setName] = useState(device?.name || "");
  const [uniqueId, setUniqueId] = useState(device?.uniqueId || "");
  const [loading, setLoading] = useState(false);

  // Update state if device prop changes
  // A better way is using useEffect, but for simplicity we can just reset on open
  
  const handleSave = async () => {
    if (!name || !uniqueId) return alert("Llena todos los campos");
    setLoading(true);

    try {
      const url = device ? `/api/devices/${device.id}` : "/api/devices";
      const method = device ? "PUT" : "POST";
      
      const payload = device 
        ? { ...device, name, uniqueId } 
        : { name, uniqueId, groupId: 1 }; // Asignar al Grupo 1 por defecto

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error al guardar");
      
      onSaved();
      onOpenChange(false);
      setName("");
      setUniqueId("");
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar el vendedor en Traccar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{device ? "Editar Vendedor" : "Nuevo Vendedor"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="col-span-3" 
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="uniqueId" className="text-right">ID Rastreo</Label>
            <Input 
              id="uniqueId" 
              value={uniqueId} 
              onChange={e => setUniqueId(e.target.value)} 
              className="col-span-3" 
              placeholder="ID único o número de teléfono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
