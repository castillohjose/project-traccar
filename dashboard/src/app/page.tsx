"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Route, LogOut, FileText } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6">
        <div className="flex items-center gap-2 font-bold text-xl text-green-700">
          <MapPin className="h-6 w-6" />
          <span>Tracking MNS</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm">
            <p className="font-medium leading-none">{user.name}</p>
            <p className="text-muted-foreground">{user.role.toUpperCase()}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Salir
          </Button>
        </div>
      </header>
      
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/mapa">
            <Card className="hover:border-green-500 cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Mapa en Vivo</CardTitle>
                <MapPin className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Ver Recorridos</div>
                <p className="text-xs text-muted-foreground">Rastreo GPS histórico</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/vendedores">
            <Card className="hover:border-blue-500 cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Gestión</div>
                <p className="text-xs text-muted-foreground">Altas, Bajas y Modificaciones</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/rutas">
            <Card className="hover:border-orange-500 cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Rutas y Horarios</CardTitle>
                <Route className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Planificación</div>
                <p className="text-xs text-muted-foreground">Gestión de clientes</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reportes">
            <Card className="hover:border-purple-500 cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Reportes</CardTitle>
                <FileText className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Auditoría</div>
                <p className="text-xs text-muted-foreground">Imprimir informes</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
