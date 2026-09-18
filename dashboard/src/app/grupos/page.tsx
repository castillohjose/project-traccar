"use client";
import { useState, useEffect } from 'react';
import { Pencil, Trash2, FolderPlus, FolderGit2, Search, CheckSquare, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export default function GruposPage() {
  const router = useRouter();
  const [grupos, setGrupos] = useState([]);
  const [nuevoGrupo, setNuevoGrupo] = useState('');
  
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<any>(null);
  const [modalContenido, setModalContenido] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  
  const [editForm, setEditForm] = useState({ id: 0, name: '' });

  const [dispositivos, setDispositivos] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [dispositivosAsignados, setDispositivosAsignados] = useState<number[]>([]);
  const [rutasAsignadas, setRutasAsignadas] = useState<number[]>([]);
  
  const [busquedaDisp, setBusquedaDisp] = useState('');
  const [busquedaRuta, setBusquedaRuta] = useState('');
  
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      setGrupos(data);
    } catch (error) {
      console.error('Error cargando grupos', error);
    }
  };

  const crearGrupo = async () => {
    if (!nuevoGrupo.trim()) return;
    try {
      await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nuevoGrupo })
      });
      setNuevoGrupo('');
      cargarDatos();
    } catch (error) {
      console.error('Error creando grupo', error);
    }
  };

  const abrirModalContenido = async (grupo: any) => {
    setGrupoSeleccionado(grupo);
    setModalContenido(true);
    try {
      const [resDisp, resRut, resElem] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/rutas'),
        fetch(`/api/grupos/${grupo.id}/elementos`)
      ]);
      setDispositivos(await resDisp.json());
      setRutas(await resRut.json());
      const dataElem = await resElem.json();
      setDispositivosAsignados(dataElem.deviceIds || []);
      setRutasAsignadas(dataElem.geofenceIds || []);
    } catch (error) {
      console.error('Error abriendo modal', error);
    }
  };

  const abrirModalEditar = (grupo: any) => {
    setEditForm({ id: grupo.id, name: grupo.name });
    setModalEditar(true);
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    try {
      await fetch(`/api/groups/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name })
      });
      setModalEditar(false);
      cargarDatos();
    } catch (error) {
      console.error('Error editando grupo', error);
    }
    setGuardando(false);
  };

  const eliminarGrupo = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta carpeta? Sus elementos internos no se borrarán, solo quedarán sin carpeta.')) return;
    try {
      await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      cargarDatos();
    } catch (error) {
      console.error('Error eliminando grupo', error);
    }
  };

  const toggleDispositivo = (id: number) => {
    setDispositivosAsignados(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleRuta = (id: number) => {
    setRutasAsignadas(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const dispositivosFiltrados = dispositivos.filter((d: any) => 
    d.name.toLowerCase().includes(busquedaDisp.toLowerCase()) || 
    (d.uniqueId && d.uniqueId.toLowerCase().includes(busquedaDisp.toLowerCase()))
  );
  
  const rutasFiltradas = rutas.filter((r: any) => 
    r.name.toLowerCase().includes(busquedaRuta.toLowerCase())
  );

  const toggleTodosDispositivos = () => {
    const idsFiltrados = dispositivosFiltrados.map((d: any) => d.id);
    const todosSeleccionados = idsFiltrados.length > 0 && idsFiltrados.every((id: number) => dispositivosAsignados.includes(id));
    if (todosSeleccionados) {
      setDispositivosAsignados(prev => prev.filter(id => !idsFiltrados.includes(id)));
    } else {
      setDispositivosAsignados(prev => Array.from(new Set([...prev, ...idsFiltrados])));
    }
  };

  const toggleTodasRutas = () => {
    const idsFiltrados = rutasFiltradas.map((r: any) => r.id);
    const todasSeleccionadas = idsFiltrados.length > 0 && idsFiltrados.every((id: number) => rutasAsignadas.includes(id));
    if (todasSeleccionadas) {
      setRutasAsignadas(prev => prev.filter(id => !idsFiltrados.includes(id)));
    } else {
      setRutasAsignadas(prev => Array.from(new Set([...prev, ...idsFiltrados])));
    }
  };

  const guardarElementos = async () => {
    setGuardando(true);
    try {
      await fetch(`/api/grupos/${grupoSeleccionado.id}/elementos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deviceIds: dispositivosAsignados, 
          geofenceIds: rutasAsignadas 
        })
      });
      setModalContenido(false);
      setGrupoSeleccionado(null);
    } catch (error) {
      console.error('Error guardando', error);
    }
    setGuardando(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/')} className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-2xl font-bold">Gestión de Carpetas (Grupos)</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FolderPlus className="w-5 h-5" /> Crear Nueva Carpeta
        </h2>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Ej: Clientes Multinacional" 
            value={nuevoGrupo}
            onChange={(e) => setNuevoGrupo(e.target.value)}
            className="border p-2 rounded flex-1 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={crearGrupo} className="bg-blue-600 hover:bg-blue-700">
            Crear Carpeta
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Nombre de la Carpeta</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g: any) => (
              <tr key={g.id} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-500">{g.id}</td>
                <td className="p-4 font-medium">{g.name}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => abrirModalContenido(g)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FolderGit2 className="w-4 h-4 mr-2" /> Asignar Contenido
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => abrirModalEditar(g)}>
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => eliminarGrupo(g.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {grupos.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">No hay carpetas creadas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para asignar elementos a la carpeta */}
      {modalContenido && grupoSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Contenido de: {grupoSeleccionado.name}</h2>
              <p className="text-gray-500 text-sm">Selecciona los vendedores y clientes que pertenecen a esta carpeta.</p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-8">
              {/* Dispositivos */}
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="font-bold text-blue-800">Vendedores (Dispositivos)</h3>
                  <Button variant="ghost" size="sm" onClick={toggleTodosDispositivos} className="h-8 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                    <CheckSquare className="w-4 h-4 mr-1" /> Marcar todos
                  </Button>
                </div>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar vendedor..."
                    value={busquedaDisp}
                    onChange={e => setBusquedaDisp(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto border p-4 rounded bg-blue-50/50 flex-1">
                  {dispositivosFiltrados.map((d: any) => (
                    <label key={d.id} className="flex items-center gap-3 p-2 hover:bg-blue-100 rounded cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={dispositivosAsignados.includes(d.id)}
                        onChange={() => toggleDispositivo(d.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">{d.name} <span className="text-xs text-gray-400">({d.uniqueId})</span></span>
                    </label>
                  ))}
                  {dispositivosFiltrados.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No hay dispositivos.</p>}
                </div>
              </div>

              {/* Geocercas */}
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="font-bold text-indigo-800">Clientes (Geocercas)</h3>
                  <Button variant="ghost" size="sm" onClick={toggleTodasRutas} className="h-8 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                    <CheckSquare className="w-4 h-4 mr-1" /> Marcar todos
                  </Button>
                </div>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={busquedaRuta}
                    onChange={e => setBusquedaRuta(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto border p-4 rounded bg-indigo-50/50 flex-1">
                  {rutasFiltradas.map((r: any) => (
                    <label key={r.id} className="flex items-center gap-3 p-2 hover:bg-indigo-100 rounded cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={rutasAsignadas.includes(r.id)}
                        onChange={() => toggleRuta(r.id)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm">{r.name}</span>
                    </label>
                  ))}
                  {rutasFiltradas.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No hay geocercas.</p>}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-4 rounded-b-xl">
              <Button variant="outline" onClick={() => setModalContenido(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={guardarElementos}
                disabled={guardando}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Carpeta */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Pencil className="text-blue-600 w-5 h-5" /> 
                Editar Nombre de Carpeta
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setModalEditar(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={guardarEdicion}
                disabled={guardando || !editForm.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
