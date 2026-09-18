'use client';
import { useState, useEffect } from 'react';
import { Pencil, Trash2, Shield, FolderGit2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from 'next/navigation';

export default function UsuariosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  
  const [nuevoUsuario, setNuevoUsuario] = useState({ 
    name: '', email: '', password: '', 
    readonly: false, administrator: false, deviceReadonly: false, limitCommands: false, disableReports: false 
  });
  
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  
  // Modals
  const [modalPermisos, setModalPermisos] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  
  const [gruposAsignados, setGruposAsignados] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({ 
    id: 0, name: '', email: '', password: '', 
    readonly: false, administrator: false, deviceReadonly: false, limitCommands: false, disableReports: false 
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resU = await fetch('/api/usuarios');
      const resG = await fetch('/api/groups');
      setUsuarios(await resU.json());
      setGrupos(await resG.json());
    } catch (error) {
      console.error('Error cargando datos', error);
    }
  };

  const crearUsuario = async () => {
    if (!nuevoUsuario.name || !nuevoUsuario.email || !nuevoUsuario.password) return;
    try {
      await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });
      setNuevoUsuario({ 
        name: '', email: '', password: '', 
        readonly: false, administrator: false, deviceReadonly: false, limitCommands: false, disableReports: false 
      });
      cargarDatos();
    } catch (error) {
      console.error('Error creando usuario', error);
    }
  };

  const abrirModalPermisos = async (user: any) => {
    setUsuarioSeleccionado(user);
    setModalPermisos(true);
    try {
      const res = await fetch(`/api/usuarios/${user.id}/permisos`);
      const data = await res.json();
      setGruposAsignados(data.groupIds || []);
    } catch (error) {
      console.error('Error cargando permisos', error);
    }
  };

  const guardarPermisos = async () => {
    setGuardando(true);
    try {
      await fetch(`/api/usuarios/${usuarioSeleccionado.id}/permisos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupIds: gruposAsignados })
      });
      setModalPermisos(false);
      setUsuarioSeleccionado(null);
    } catch (error) {
      console.error('Error guardando permisos', error);
    }
    setGuardando(false);
  };

  const abrirModalEditar = (user: any) => {
    setEditForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '', // Password en blanco para no sobreescribir si no se escribe nada
      readonly: user.readonly || false,
      administrator: user.administrator || false,
      deviceReadonly: user.deviceReadonly || false,
      limitCommands: user.limitCommands || false,
      disableReports: user.disableReports || false,
    });
    setModalEditar(true);
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    try {
      const body: any = { 
        name: editForm.name, 
        email: editForm.email, 
        readonly: editForm.readonly,
        administrator: editForm.administrator,
        deviceReadonly: editForm.deviceReadonly,
        limitCommands: editForm.limitCommands,
        disableReports: editForm.disableReports
      };
      if (editForm.password) body.password = editForm.password;

      await fetch(`/api/usuarios/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      setModalEditar(false);
      cargarDatos();
    } catch (error) {
      console.error('Error editando usuario', error);
    }
    setGuardando(false);
  };

  const eliminarUsuario = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Perderá el acceso de inmediato.')) return;
    try {
      await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
      cargarDatos();
    } catch (error) {
      console.error('Error eliminando usuario', error);
    }
  };

  const toggleGrupo = (id: number) => {
    setGruposAsignados(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/')} className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8 border-t-4 border-t-blue-600">
        <h2 className="text-lg font-semibold mb-4">Crear Nuevo Usuario</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Nombre (Ej: Empresa X)" 
            value={nuevoUsuario.name}
            onChange={(e) => setNuevoUsuario({...nuevoUsuario, name: e.target.value})}
            className="border p-2 rounded w-full outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input 
            type="email" 
            placeholder="Correo Electrónico" 
            value={nuevoUsuario.email}
            onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
            className="border p-2 rounded w-full outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input 
            type="text" 
            placeholder="Contraseña" 
            value={nuevoUsuario.password}
            onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
            className="border p-2 rounded w-full outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={nuevoUsuario.readonly}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, readonly: e.target.checked})}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-sm">Solo Lectura Global</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={nuevoUsuario.administrator}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, administrator: e.target.checked})}
                className="w-4 h-4 rounded text-red-600"
              />
              <span className="text-sm font-semibold text-red-700">Privilegios de Administrador</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={nuevoUsuario.deviceReadonly}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, deviceReadonly: e.target.checked})}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-sm">Vendedores de Solo Lectura</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={nuevoUsuario.limitCommands}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, limitCommands: e.target.checked})}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-sm">Bloquear el Envío de Comandos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={nuevoUsuario.disableReports}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, disableReports: e.target.checked})}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-sm">Desactivar Reportes</span>
            </label>
          </div>

          <button onClick={crearUsuario} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-bold transition-colors shadow-md w-full md:w-auto">
            Crear Usuario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Correo</th>
              <th className="p-4">Nivel de Permisos</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u: any) => {
              if (u.email === 'robot@sistema.com') return null; // Ocultar el robot del sistema
              
              let permLabel = 'Estándar';
              let Icon = Shield;
              let colorClass = 'text-green-600';
              
              if (u.administrator) {
                permLabel = 'Administrador Maestro';
                Icon = ShieldAlert;
                colorClass = 'text-red-600 font-bold';
              } else if (u.readonly) {
                permLabel = 'Solo Lectura';
                colorClass = 'text-orange-600';
              } else if (u.deviceReadonly || u.limitCommands || u.disableReports) {
                permLabel = 'Estándar (Restringido)';
                colorClass = 'text-blue-600';
              }

              return (
                <tr key={u.id} className="border-b hover:bg-gray-50/50">
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-gray-500">{u.email}</td>
                  <td className="p-4">
                    <span className={`flex items-center gap-1 ${colorClass}`}>
                      <Icon className="w-4 h-4" /> {permLabel}
                    </span>
                    {(!u.administrator && (u.deviceReadonly || u.limitCommands || u.disableReports)) && (
                      <div className="text-xs text-gray-400 mt-1">
                        {u.deviceReadonly && "• Disp. Bloqueados "}
                        {u.limitCommands && "• Sin Comandos "}
                        {u.disableReports && "• Sin Reportes"}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      {!u.administrator && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => abrirModalPermisos(u)}
                          className="text-indigo-600 hover:text-indigo-800 mr-2"
                        >
                          <FolderGit2 className="w-4 h-4 mr-2" /> Asignar Carpetas
                        </Button>
                      )}
                      {(user && Number(user.id) !== u.id) && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => abrirModalEditar(u)}>
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => eliminarUsuario(u.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Permisos de Carpetas */}
      {modalPermisos && usuarioSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FolderGit2 className="text-indigo-600" /> 
                Carpetas de {usuarioSeleccionado.name}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Selecciona las carpetas (y todo su contenido) que este usuario podrá ver en el mapa.</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh] space-y-3">
              {grupos.map((g: any) => (
                <label key={g.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={gruposAsignados.includes(g.id)}
                    onChange={() => toggleGrupo(g.id)}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="font-medium">{g.name}</span>
                </label>
              ))}
              {grupos.length === 0 && <p className="text-gray-500 text-sm text-center">No hay carpetas creadas en el sistema.</p>}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setModalPermisos(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={guardarPermisos}
                disabled={guardando}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {guardando ? 'Sincronizando...' : 'Guardar y Sincronizar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Pencil className="text-blue-600" /> 
                Editar Perfil de Usuario
              </h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full border p-2 rounded focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full border p-2 rounded focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña</label>
                <input 
                  type="text" 
                  placeholder="Dejar en blanco para no cambiarla"
                  value={editForm.password}
                  onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                  className="w-full border p-2 rounded focus:ring-blue-500 outline-none bg-blue-50/30"
                />
              </div>
              
              <div className="pt-4 pb-2 border-t mt-4">
                <h3 className="font-semibold text-gray-700 mb-3">Nivel de Seguridad y Permisos</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer bg-red-50 p-2 rounded border border-red-100">
                    <input 
                      type="checkbox" 
                      checked={editForm.administrator}
                      onChange={(e) => setEditForm({...editForm, administrator: e.target.checked})}
                      className="w-4 h-4 rounded text-red-600"
                    />
                    <span className="text-sm font-bold text-red-700">Convertir en Administrador Maestro</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editForm.readonly}
                      onChange={(e) => setEditForm({...editForm, readonly: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-sm">Solo Lectura Global (Bloquea cualquier edición)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editForm.deviceReadonly}
                      onChange={(e) => setEditForm({...editForm, deviceReadonly: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-sm">Vendedores (Dispositivos) de Solo Lectura</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editForm.limitCommands}
                      onChange={(e) => setEditForm({...editForm, limitCommands: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-sm">Bloquear el Envío de Comandos al GPS</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editForm.disableReports}
                      onChange={(e) => setEditForm({...editForm, disableReports: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-sm">Desactivar la Generación de Reportes</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setModalEditar(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={guardarEdicion}
                disabled={guardando}
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
