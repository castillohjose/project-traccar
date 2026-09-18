"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, FolderPlus, Search, Folder, Pencil, Trash2, X } from "lucide-react";
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
  const [groups, setGroups] = useState<any[]>([]);
  const [groupMap, setGroupMap] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  
  // Selection & Filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resDev, resPos, resGroups] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/positions'),
        fetch('/api/groups')
      ]);
      const devicesData = await resDev.json();
      const positionsData = await resPos.json();
      const groupsData = await resGroups.json();

      if (Array.isArray(devicesData)) setDevices(devicesData);
      if (Array.isArray(positionsData)) setPositions(positionsData);
      
      let gMap: Record<number, any[]> = {};
      if (Array.isArray(groupsData)) {
        const vendorGroups = groupsData.filter(g => g.name.startsWith('Vendedores'));
        setGroups(vendorGroups);
        
        // Fetch elements for each group to build the map
        for (const g of vendorGroups) {
          try {
            const resEl = await fetch(`/api/grupos/${g.id}/elementos`);
            const dataEl = await resEl.json();
            if (dataEl.deviceIds) {
              dataEl.deviceIds.forEach((devId: number) => {
                if (!gMap[devId]) gMap[devId] = [];
                gMap[devId].push(g);
              });
            }
          } catch (e) {
            console.error("Error loading elements for group", g.id);
          }
        }
      }
      setGroupMap(gMap);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (device?: Device) => {
    setSelectedDevice(device || null);
    setDialogOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDevices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDevices.map(c => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleRemoveFolder = async (deviceId: number, folderId: number) => {
    if (!confirm("¿Quitar este vendedor de esta carpeta?")) return;
    try {
      const resEl = await fetch(`/api/grupos/${folderId}/elementos`);
      const dataEl = await resEl.json();
      const newDeviceIds = (dataEl.deviceIds || []).filter((id: number) => id !== deviceId);
      await fetch(`/api/grupos/${folderId}/elementos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceIds: newDeviceIds,
          geofenceIds: dataEl.geofenceIds || []
        })
      });
      loadData();
    } catch (e) {
      console.error(e);
      alert("Error al quitar de la carpeta");
    }
  };

  const handleAssignFolders = async () => {
    if (selectedIds.length === 0) return;
    setSavingFolder(true);
    
    try {
      let targetGroupId = selectedFolderId;
      
      // If creating new folder
      if (targetGroupId === "new" && newFolderName.trim()) {
        const fullFolderName = `Vendedores ${newFolderName.trim()}`;
        const resG = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fullFolderName })
        });
        const newG = await resG.json();
        targetGroupId = newG.id.toString();
      }

      if (!targetGroupId || targetGroupId === "new") {
        alert("Selecciona o crea una carpeta válida");
        setSavingFolder(false);
        return;
      }

      // Fetch current elements of that folder to append, not replace
      const resEl = await fetch(`/api/grupos/${targetGroupId}/elementos`);
      const dataEl = await resEl.json();
      
      const existingDevices = dataEl.deviceIds || [];
      const combinedDevices = Array.from(new Set([...existingDevices, ...selectedIds]));

      await fetch(`/api/grupos/${targetGroupId}/elementos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceIds: combinedDevices,
          geofenceIds: dataEl.geofenceIds || []
        })
      });

      setFolderDialogOpen(false);
      setSelectedIds([]);
      setNewFolderName("");
      setSelectedFolderId("");
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error al asignar carpetas");
    }
    setSavingFolder(false);
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.uniqueId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-gray-50/50 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Vendedores y Carpetas</h1>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" /> Nuevo Vendedor
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Directorio de Vendedores (Dispositivos)</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar vendedor o IMEI..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 border rounded-md w-full text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando datos...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.length > 0 && selectedIds.length === filteredDevices.length}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                        />
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Nombre del Vendedor</TableHead>
                      <TableHead>Carpetas</TableHead>
                      <TableHead>Identificador (IMEI/App)</TableHead>
                      <TableHead>Última Conexión</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No se encontraron vendedores.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDevices.map((device) => {
                        const pos = positions.find((p: any) => p.deviceId === device.id);
                        const isOnline = device.status === "online";
                        const devFolders = groupMap[device.id] || [];
                        
                        return (
                          <TableRow key={device.id} className={selectedIds.includes(device.id) ? "bg-blue-50/50" : ""}>
                            <TableCell>
                              <input 
                                type="checkbox" 
                                checked={selectedIds.includes(device.id)}
                                onChange={() => toggleSelect(device.id)}
                                className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <span className="text-sm text-gray-600">{isOnline ? 'En línea' : 'Desconectado'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">{device.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {devFolders.length === 0 ? (
                                  <span className="text-xs text-gray-400 italic">Sin carpeta</span>
                                ) : (
                                  devFolders.map(f => (
                                    <Badge key={f.id} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 text-[10px] group pr-1">
                                      <Folder className="w-3 h-3" />
                                      {f.name.replace('Vendedores ', '')}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveFolder(device.id, f.id); }}
                                        className="ml-1 p-0.5 rounded-full hover:bg-indigo-200 text-indigo-400 hover:text-indigo-800 transition-colors"
                                        title="Quitar de esta carpeta"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-gray-500">{device.uniqueId}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'Nunca'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(device)}>
                                  <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Action Bar for Selected Items */}
              {selectedIds.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
                  <span className="text-blue-800 font-medium">
                    {selectedIds.length} vendedor{selectedIds.length > 1 ? 'es' : ''} seleccionado{selectedIds.length > 1 ? 's' : ''}
                  </span>
                  <Button onClick={() => setFolderDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <FolderPlus className="w-4 h-4 mr-2" /> Organizar en Carpeta
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <DeviceDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        device={selectedDevice} 
        onSaved={loadData}
      />

      {/* Folder Assignment Modal */}
      {folderDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FolderPlus className="text-indigo-600" /> 
              Asignar a Carpeta
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Mueve los {selectedIds.length} vendedores seleccionados a una carpeta específica.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Seleccionar Carpeta Existente</label>
                <select 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                >
                  <option value="">-- Elige una carpeta --</option>
                  <option value="new" className="font-bold text-indigo-600">+ Crear Nueva Carpeta</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {selectedFolderId === "new" && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium mb-1">Nombre de la Nueva Empresa/Carpeta</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 px-3 py-2 rounded-l text-gray-500 font-medium whitespace-nowrap">
                      Vendedores
                    </span>
                    <input 
                      type="text" 
                      placeholder="Ej: Multinacional" 
                      className="w-full border p-2 rounded-r focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700" 
                onClick={handleAssignFolders}
                disabled={savingFolder || (!selectedFolderId) || (selectedFolderId === "new" && !newFolderName.trim())}
              >
                {savingFolder ? 'Guardando...' : 'Aplicar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
