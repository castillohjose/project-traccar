"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      setError("");
    } else {
      setError("Credenciales incorrectas.");
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-green-100 p-3 rounded-full w-fit">
            <MapPin className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Tracking MNS</CardTitle>
          <CardDescription>
            Inicia sesión en tu cuenta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Input 
                id="email" 
                type="email" 
                placeholder="correo@ejemplo.com" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Input 
                id="password" 
                type="password" 
                placeholder="Contraseña"
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            
            <div className="text-xs text-gray-500 mt-2">
              <p>Demo accounts (pwd = role):</p>
              <ul className="list-disc pl-4 mt-1">
                <li>admin@greenpack.com / admin</li>
                <li>super@greenpack.com / super</li>
                <li>user@greenpack.com / user</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Entrar al Panel</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
