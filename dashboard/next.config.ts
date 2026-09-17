import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para que Docker cree una versión ultra-ligera (150MB) en producción
  output: 'standalone',
  // Permitir acceder al entorno de desarrollo a través de túneles
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "localhost"
  ],
};

export default nextConfig;
