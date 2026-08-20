"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Clock, Map, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Client {
  id: string;
  name: string;
  address: string;
}

export default function RutasPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("dashboard_clients");
    if (saved) setClients(JSON.parse(saved));
  }, []);

  const saveClients = (data: Client[]) => {
    setClients(data);
    localStorage.setItem("dashboard_clients", JSON.stringify(data));
  };

  const handleAddClient = () => {
    if (!newClientName) return;
    const newClient = { id: Date.now().toString(), name: newClientName, address: newClientAddress };
    saveClients([...clients, newClient]);
    setNewClientName("");
    setNewClientAddress("");
    setDialogOpen(false);
  };

  const handleDeleteClient = (id: string) => {
    saveClients(clients.filter(c => c.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-gray-50/50 w-full">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Rutas y Horarios</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-orange-500" />
                <CardTitle>Cartera de Clientes</CardTitle>
              </div>
              {user?.role !== 'normal' && (
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Añadir
                </Button>
              )}
            </div>
            <CardDescription>Lista de clientes que los vendedores deben visitar</CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-sm text-gray-500 mb-4 text-center py-4 border rounded-lg border-dashed">
                No hay clientes registrados en el sistema.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {clients.map(client => (
                  <div key={client.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                    <div>
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.address || "Sin dirección"}</p>
                    </div>
                    {user?.role !== 'normal' && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <CardTitle>Horarios Laborales</CardTitle>
            </div>
            <CardDescription>Auditoría de horas de inicio y fin de jornada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <div className="flex justify-between mb-2 border-b pb-2">
                <span className="font-medium text-sm">Entrada Oficial:</span>
                <span className="text-sm text-gray-600">08:00 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-sm">Salida Oficial:</span>
                <span className="text-sm text-gray-600">05:00 PM</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-4 text-center">
              *Los horarios se calculan según el primer y último punto de GPS enviado por la aplicación en el día.
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cname" className="text-right">Nombre</Label>
              <Input 
                id="cname" 
                value={newClientName} 
                onChange={e => setNewClientName(e.target.value)} 
                className="col-span-3" 
                placeholder="Ej. Distribuidora Central"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Dirección</Label>
              <Input 
                id="address" 
                value={newClientAddress} 
                onChange={e => setNewClientAddress(e.target.value)} 
                className="col-span-3" 
                placeholder="Ubicación opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddClient}>Guardar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
