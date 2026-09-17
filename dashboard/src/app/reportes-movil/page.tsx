"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, FileText, CalendarIcon, Battery, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { es } from "date-fns/locale";

interface Device {
  id: number;
  name: string;
  uniqueId: string;
  attributes?: any;
}

interface ClientData {
  id: number;
  name: string;
  area: string;
  description?: string;
  attributes?: {
    imageUrl?: string;
  };
}

interface Visit {
  client: ClientData;
  entryTime: string;
  exitTime: string | null;
}

export default function ReportesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [visits, setVisits] = useState<Visit[]>([]);
  const [startBatteryLevel, setStartBatteryLevel] = useState<number | null>(null);
  const [endBatteryLevel, setEndBatteryLevel] = useState<number | null>(null);
  const [totalConsumedBattery, setTotalConsumedBattery] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/devices')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setDevices(data); })
      .catch(console.error);

    fetch('/api/rutas')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setClients(data); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDeviceId) return;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    
    const from = new Date(year, month, day, 0, 0, 0);
    const to = new Date(year, month, day, 23, 59, 59);

    fetch(`/api/positions?deviceId=${selectedDeviceId}&from=${from.toISOString()}&to=${to.toISOString()}`)
      .then(res => res.json())
      .then(history => {
        if (!Array.isArray(history) || history.length === 0) {
          setVisits([]);
          setStartBatteryLevel(null);
          setEndBatteryLevel(null);
          setTotalConsumedBattery(null);
          return;
        }

        // Get first and last battery level from the day's positions
        const firstPosWithBattery = history.find(p => p.attributes?.batteryLevel !== undefined);
        const lastPosWithBattery = history.slice().reverse().find(p => p.attributes?.batteryLevel !== undefined);
        
        if (firstPosWithBattery) {
          setStartBatteryLevel(firstPosWithBattery.attributes.batteryLevel);
        } else {
          setStartBatteryLevel(null);
        }

        if (lastPosWithBattery) {
          setEndBatteryLevel(lastPosWithBattery.attributes.batteryLevel);
        } else {
          setEndBatteryLevel(null);
        }

        // Compute total consumed battery (ignoring recharges)
        let consumed = 0;
        let prevBattery = firstPosWithBattery ? firstPosWithBattery.attributes.batteryLevel : null;
        
        for (let i = 0; i < history.length; i++) {
          const currentBattery = history[i].attributes?.batteryLevel;
          if (currentBattery !== undefined && prevBattery !== null) {
            if (currentBattery < prevBattery) {
              consumed += (prevBattery - currentBattery);
            }
            prevBattery = currentBattery;
          } else if (currentBattery !== undefined) {
            prevBattery = currentBattery;
          }
        }
        setTotalConsumedBattery(consumed);

        // Compute visits
        const computedVisits: Visit[] = [];
        let currentVisit: Visit | null = null;

        const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371e3;
          const dLat = (lat2-lat1) * Math.PI/180;
          const dLon = (lon2-lon1) * Math.PI/180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
        };

        for (let index = 0; index < history.length; index++) {
          const pos = history[index];
          let insideClient: ClientData | null = null;
          for (const client of clients) {
            if (client.area && client.area.startsWith("CIRCLE")) {
              const match = client.area.match(/CIRCLE \(([^ ]+) ([^,]+), ([^)]+)\)/);
              if (match) {
                const cLat = parseFloat(match[1]);
                const cLng = parseFloat(match[2]);
                const cRad = parseFloat(match[3]);
                if (getDistance(pos.latitude, pos.longitude, cLat, cLng) <= cRad) {
                  insideClient = client;
                  break;
                }
              }
            }
          }

          if (insideClient) {
            if (!currentVisit || currentVisit.client.id !== insideClient.id) {
              if (currentVisit) {
                currentVisit.exitTime = pos.fixTime;
                computedVisits.push(currentVisit);
              }
              currentVisit = {
                client: insideClient,
                entryTime: pos.fixTime,
                exitTime: null
              };
            }
          } else {
            if (currentVisit) {
              currentVisit.exitTime = pos.fixTime;
              computedVisits.push(currentVisit);
              currentVisit = null;
            }
          }
        }

        if (currentVisit) {
          currentVisit.exitTime = history[history.length - 1].fixTime;
          computedVisits.push(currentVisit);
        }

        setVisits(computedVisits);
      })
      .catch(console.error);
  }, [selectedDeviceId, selectedDate, clients]);

  const handlePrint = () => {
    window.print();
  };

  const selectedDevice = devices.find(d => d.id.toString() === selectedDeviceId);
  const workHours = selectedDevice?.attributes?.workHours || "No definido";

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-white w-full print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Reportes de Vendedores</h1>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Reporte
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Panel de Filtros */}
        <Card className="md:col-span-1 print:hidden">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Seleccionar Vendedor</label>
              <Select value={selectedDeviceId} onValueChange={(v) => v && setSelectedDeviceId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir vendedor..." />
                </SelectTrigger>
                <SelectContent>
                  {devices.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name || d.uniqueId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Fecha a Reportar</label>
              <div className="bg-gray-50 border rounded-md flex justify-center p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  locale={es}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel de Reporte */}
        <Card className="md:col-span-3 print:col-span-4 print:shadow-none print:border-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 print:hidden" />
              <CardTitle>Reporte de Actividad Diaria</CardTitle>
            </div>
            <CardDescription>Resumen analítico de visitas a clientes y consumo de batería.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedDevice ? (
              <div className="text-center p-12 text-gray-500">
                Selecciona un vendedor en el panel izquierdo para generar el reporte.
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {/* Cabecera del Vendedor */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border">
                  <div>
                    <h3 className="text-xs uppercase text-gray-500 font-bold mb-1">Nombre / ID Vendedor</h3>
                    <p className="text-lg font-semibold">{selectedDevice.name || "Sin Nombre"}</p>
                    <p className="text-sm text-gray-600">{selectedDevice.uniqueId}</p>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase text-gray-500 font-bold mb-1 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> Fecha del Reporte
                    </h3>
                    <p className="text-lg font-medium capitalize">
                      {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase text-gray-500 font-bold mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Horario de Trabajo
                    </h3>
                    <p className="text-lg font-medium">{workHours}</p>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase text-gray-500 font-bold mb-1 flex items-center gap-1">
                      <Battery className="h-3 w-3" /> Consumo de Batería
                    </h3>
                    {startBatteryLevel !== null && endBatteryLevel !== null && totalConsumedBattery !== null ? (
                      <div>
                        <p className="text-lg font-medium text-blue-600">
                          {totalConsumedBattery}% consumido
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Inicio: {startBatteryLevel}% → Final: {endBatteryLevel}%
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-medium">No registrado</p>
                    )}
                  </div>
                </div>

                {/* Tabla de Visitas */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Registro de Visitas a Clientes
                  </h3>
                  {visits.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-lg border text-gray-500">
                      No se detectaron visitas a clientes en la fecha seleccionada.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente / Razón Social</TableHead>
                          <TableHead>Hora de Llegada</TableHead>
                          <TableHead>Hora de Salida</TableHead>
                          <TableHead>Tiempo de Estadía</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visits.map((visit, i) => {
                          const start = new Date(visit.entryTime);
                          const end = visit.exitTime ? new Date(visit.exitTime) : null;
                          const diffMins = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;

                          return (
                            <TableRow key={i}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                  {visit.client.attributes?.imageUrl ? (
                                    <img src={visit.client.attributes.imageUrl} alt={visit.client.name} className="w-8 h-8 rounded-full object-cover border" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border">
                                      <MapPin className="h-4 w-4" />
                                    </div>
                                  )}
                                  {visit.client.name}
                                </div>
                              </TableCell>
                              <TableCell>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                              <TableCell>{end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</TableCell>
                              <TableCell>{diffMins !== null ? `${diffMins} min` : '---'}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
