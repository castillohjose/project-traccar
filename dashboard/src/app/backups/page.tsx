"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Upload, Server, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function BackupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [deepBackups, setDeepBackups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDeep, setLoadingDeep] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    fetch('/api/groups')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGroups(data);
      })
      .catch(console.error);
      
    loadDeepBackups();
  }, []);

  const loadDeepBackups = () => {
    fetch('/api/backups/deep')
      .then(res => res.json())
      .then(data => {
        if (data.files) setDeepBackups(data.files);
      })
      .catch(console.error);
  };

  const handleGroupToggle = (id: number) => {
    setSelectedGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleExportLight = async () => {
    if (selectedGroups.length === 0) return alert("Selecciona al menos un grupo");
    setLoading(true);
    try {
      const res = await fetch('/api/backups/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupIds: selectedGroups })
      });
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `respaldo_grupos_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      alert("Respaldo ligero exportado");
    } catch (e) {
      alert("Error al exportar");
    }
    setLoading(false);
  };

  const handleImportLight = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/backups/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        if (res.ok) {
          alert("Respaldo importado correctamente");
        } else {
          alert("Error al importar el respaldo");
        }
      } catch (err) {
        alert("Archivo inválido");
      }
      setLoading(false);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleCreateDeepBackup = async () => {
    setLoadingDeep(true);
    try {
      const res = await fetch('/api/backups/deep', { method: 'POST' });
      if (res.ok) {
        alert("Respaldo profundo guardado en el servidor");
        loadDeepBackups();
      } else {
        alert("Error al generar respaldo profundo");
      }
    } catch (e) {
      alert("Error crítico");
    }
    setLoadingDeep(false);
  };

  const handleRestoreDeepBackup = async (fileName: string) => {
    if (!confirm(`¿Estás SEGURO de restaurar ${fileName}? Esto sobreescribirá toda la base de datos.`)) return;
    
    setLoadingDeep(true);
    try {
      const res = await fetch('/api/backups/deep/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });
      if (res.ok) {
        setShowWarning(true);
      } else {
        alert("Error al restaurar");
      }
    } catch (e) {
      alert("Error crítico al restaurar");
    }
    setLoadingDeep(false);
  };

  if (user?.role === 'normal' || user?.readonly) {
    return <div className="p-6 text-center text-red-500 font-bold">Acceso Denegado</div>;
  }

  if (showWarning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-600 text-white p-6 text-center">
        <ShieldAlert className="h-24 w-24 mb-6 animate-pulse" />
        <h1 className="text-4xl font-black mb-4">BASE DE DATOS RESTAURADA</h1>
        <p className="text-xl max-w-2xl font-medium">
          El respaldo profundo ha sido inyectado en el servidor. Por razones de seguridad y arquitectura, Traccar ha sido pausado.
        </p>
        <div className="mt-8 bg-black/30 p-6 rounded-lg text-left">
          <p className="font-bold mb-2">PASO MANUAL REQUERIDO INMEDIATAMENTE:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Abre la consola física o SSH del servidor.</li>
            <li>Navega a la carpeta del proyecto.</li>
            <li>Ejecuta el siguiente comando para reiniciar la RAM de Traccar:
              <pre className="bg-black/50 text-green-400 p-3 rounded mt-2 select-all">docker compose restart traccar</pre>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-gray-50/50 w-full">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Gestión de Respaldos</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* RESPALDO LIGERO */}
        <Card>
          <CardHeader>
            <CardTitle>Respaldo Estructural (Nube)</CardTitle>
            <CardDescription>Respalda solo la estructura de los grupos, vendedores y clientes en un archivo JSON descargable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md p-4 space-y-3">
              <h3 className="font-semibold text-sm">Selecciona los Grupos a Exportar:</h3>
              {groups.length === 0 ? <p className="text-sm text-gray-500">No hay grupos creados.</p> : null}
              {groups.map(g => (
                <div key={g.id} className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    id={`g-${g.id}`} 
                    checked={selectedGroups.includes(g.id)}
                    onChange={() => handleGroupToggle(g.id)}
                  />
                  <label htmlFor={`g-${g.id}`} className="text-sm cursor-pointer">{g.name}</label>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <Button onClick={handleExportLight} disabled={loading} className="w-full">
                <Download className="h-4 w-4 mr-2" /> Exportar Grupos
              </Button>
              
              <div className="relative w-full">
                <input 
                  type="file" 
                  accept=".json" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImportLight}
                  disabled={loading}
                />
                <Button variant="outline" disabled={loading} className="w-full border-green-500 text-green-700 hover:bg-green-50">
                  <Upload className="h-4 w-4 mr-2" /> Importar / Cargar Respaldo Ligero
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RESPALDO PROFUNDO */}
        <Card className="border-red-200 shadow-sm">
          <CardHeader className="bg-red-50/50 rounded-t-xl">
            <CardTitle className="text-red-700 flex items-center">
              <Server className="h-5 w-5 mr-2" /> Respaldo Profundo (Servidor)
            </CardTitle>
            <CardDescription>Volcado completo de la base de datos, incluyendo millones de puntos GPS históricos. Inaccesible desde la red.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Button onClick={handleCreateDeepBackup} disabled={loadingDeep} variant="destructive" className="w-full">
              Generar Nuevo Respaldo Interno
            </Button>

            <div className="border rounded-md p-4 mt-4">
              <h3 className="font-semibold text-sm mb-3">Respaldos Locales Existentes:</h3>
              {deepBackups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No hay respaldos profundos.</p>
              ) : (
                <ul className="space-y-2">
                  {deepBackups.map(file => (
                    <li key={file} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                      <span className="truncate mr-2 font-mono text-xs">{file}</span>
                      <Button variant="outline" size="sm" onClick={() => handleRestoreDeepBackup(file)} disabled={loadingDeep}>
                        Restaurar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
