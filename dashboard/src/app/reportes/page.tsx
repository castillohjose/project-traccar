"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ReportesPage() {
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/devices')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setDevices(data); })
      .catch(console.error);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-white w-full print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Reportes y Auditoría</h1>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Reporte
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500 print:hidden" />
            <CardTitle>Reporte de Actividad de Vendedores</CardTitle>
          </div>
          <CardDescription>Resumen general de dispositivos registrados y su último estado conocido.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center mb-8">
            <div className="p-4 bg-gray-100 rounded-lg print:border">
              <div className="text-3xl font-bold text-green-600">{devices.filter(d => d.status === 'online').length}</div>
              <div className="text-sm text-gray-500">Vendedores Activos</div>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg print:border">
              <div className="text-3xl font-bold text-blue-600">{devices.length}</div>
              <div className="text-sm text-gray-500">Total Vendedores Registrados</div>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg print:border">
              <div className="text-3xl font-bold text-orange-600">--</div>
              <div className="text-sm text-gray-500">Rutas Cumplidas</div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4 mt-8 border-b pb-2">Detalle de Vendedores</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>ID de Rastreo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Conexión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No hay datos para mostrar.</TableCell>
                </TableRow>
              ) : (
                devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>{device.uniqueId}</TableCell>
                    <TableCell>{device.status === 'online' ? 'Conectado' : 'Desconectado'}</TableCell>
                    <TableCell>{device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'Nunca'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
