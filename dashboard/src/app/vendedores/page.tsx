"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { DeviceDialog } from "@/components/DeviceDialog";

interface Device {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string;
}

export default function VendedoresPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const loadDevices = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/devices').then(res => res.json()),
      fetch('/api/positions').then(res => res.json())
    ])
      .then(([devicesData, positionsData]) => {
        if (Array.isArray(devicesData)) setDevices(devicesData);
        if (Array.isArray(positionsData)) setPositions(positionsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleOpenDialog = (device?: Device) => {
    setSelectedDevice(device || null);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-gray-50/50 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Gestión de Vendedores</h1>
        </div>
        
        {user?.role !== 'normal' && (
          <Button onClick={() => handleOpenDialog()}>
            <UserPlus className="mr-2 h-4 w-4" /> Nuevo Vendedor
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendedores Registrados (Dispositivos)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando datos desde Traccar...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>ID de Rastreo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Conexión</TableHead>
                  {user?.role !== 'normal' && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No hay vendedores registrados.</TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => {
                    let displayName = device.name;
                    if (device.name === device.uniqueId) {
                      const latestPos = positions.find(p => p.deviceId === device.id);
                      if (latestPos?.attributes?.vendedor) {
                        displayName = `${latestPos.attributes.vendedor} (Sugerido)`;
                      }
                    }

                    return (
                      <TableRow key={device.id}>
                        <TableCell className="font-medium">{displayName}</TableCell>
                        <TableCell>{device.uniqueId}</TableCell>
                        <TableCell>
                          <Badge variant={device.status === 'online' ? 'default' : 'secondary'} className={device.status === 'online' ? 'bg-green-500' : ''}>
                            {device.status === 'online' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'Desconocido'}</TableCell>
                        
                        {user?.role !== 'normal' && (
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(device)}>
                              Editar
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Modal is outside of the card, but rendered here */}
      {dialogOpen && (
        <DeviceDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          device={selectedDevice} 
          onSaved={loadDevices} 
        />
      )}
    </div>
  );
}
