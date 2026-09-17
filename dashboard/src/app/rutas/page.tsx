"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, MapPin, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { ClientDialog, ClientData } from "@/components/ClientDialog";
import { Badge } from "@/components/ui/badge";

export default function RutasPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

  const loadClients = () => {
    setLoading(true);
    fetch('/api/rutas')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleOpenDialog = (client?: ClientData) => {
    setSelectedClient(client || null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este cliente/ruta?")) return;
    
    try {
      const res = await fetch(`/api/rutas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Error al eliminar");
      loadClients();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el cliente");
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes y Rutas</h1>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Lista de Clientes (Puntos de Interés)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando clientes...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre / Razón Social</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Área Geocerca</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No hay clientes registrados. Haz clic en "Nuevo Cliente" para añadir uno.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map(client => {
                    // Extract radius if possible to show
                    let radiusLabel = "Área";
                    if (client.area && client.area.startsWith("CIRCLE")) {
                      const match = client.area.match(/CIRCLE \([^,]+, ([^)]+)\)/);
                      if (match) radiusLabel = `Radio: ${match[1]}m`;
                    }

                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {client.attributes?.imageUrl ? (
                              <img src={client.attributes.imageUrl} alt={client.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <MapPin className="h-4 w-4" />
                              </div>
                            )}
                            {client.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{client.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {radiusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(client)}>
                              <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => client.id && handleDelete(client.id)}>
                              <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ClientDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        client={selectedClient} 
        onSaved={loadClients}
      />
    </div>
  );
}
