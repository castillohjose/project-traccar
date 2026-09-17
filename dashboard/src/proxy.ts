import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Si la petición va dirigida a rutas internas de Next.js o a nuestras otras APIs, la dejamos pasar.
  const isApiRoute = path.startsWith('/api/');
  const isNextStatic = path.startsWith('/_next/') || path.startsWith('/favicon.ico');

  // CORTAFUEGOS DE SEGURIDAD PARA TÚNELES PÚBLICOS
  // Verificamos si la petición viene de internet (Cloudflare o Localtunnel)
  const host = request.headers.get('host') || '';
  const isPublicTunnel = host.includes('cloudflare.com') || host.includes('loca.lt');

  if (isPublicTunnel) {
    // Solo permitimos el mapa móvil, los reportes móviles, la API (para recibir GPS) y archivos estáticos
    const isAllowedPublicRoute = 
      path.startsWith('/mapa-movil') || 
      path.startsWith('/reportes-movil') || 
      path.startsWith('/api/') || 
      isNextStatic;
      
    if (!isAllowedPublicRoute) {
      console.log(`[CORTAFUEGOS] Intento de acceso bloqueado a '${path}' desde internet.`);
      return new NextResponse(
        "Acceso Denegado: Por seguridad corporativa, esta ruta de administración solo es accesible desde la red local.", 
        { status: 403 }
      );
    }
  }

  // EL SEGURO (SAFETY LOCK):
  // Si recibimos una petición POST que NO va a la carpeta /api/ (por ejemplo, a '/' o '/mapa-movil'),
  // en lugar de devolver la página HTML con código 200 (lo que vaciaría la bóveda del celular),
  // y en lugar de redirigir a ciegas (lo cual podría ser una brecha de seguridad si un atacante envía POSTs masivos),
  // la RECHAZAMOS con un error 400 Bad Request.
  // Al recibir un 400, el SDK de Traccar dirá "Uy, error", y NO borrará los puntos de su memoria. 
  // Los datos estarán a salvo hasta que tú te des cuenta y corrijas la URL en la app.
  if (!isApiRoute && !isNextStatic && request.method === 'POST') {
    console.log(`[SEGURO ACTIVADO] Petición POST extraviada bloqueada en '${path}'.`);
    
    return new NextResponse(
      "Bad Request: Ruta invalida para envío de datos. Asegúrate de apuntar a /api/gps en la app.", 
      { status: 400 }
    );
  }

  // Si no es un POST extraviado, la dejamos continuar normalmente
  return NextResponse.next();
}

// Configuración opcional para evitar que el middleware se ejecute en rutas de recursos estáticos por completo
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
