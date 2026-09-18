import { NextRequest, NextResponse } from 'next/server';
import { fetchTraccar, ensureGroupExists } from '@/lib/traccar';

async function forwardToTraccar(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.searchParams.toString());
    let deviceId = searchParams.get('id');
    let bodyText = "";

    if (request.method === 'POST') {
      bodyText = await request.text();
      if (bodyText) {
        // Intenta extraer los parámetros del body (ej. id=123456&lat=...)
        const bodyParams = new URLSearchParams(bodyText);
        
        // Si el body contiene parámetros, los fusionamos en searchParams
        // para asegurarnos de que Traccar los lea correctamente por la URL
        for (const [key, value] of bodyParams.entries()) {
          searchParams.set(key, value);
        }
        
        if (!deviceId && searchParams.has('id')) {
          deviceId = searchParams.get('id');
        }
      }
    }

    // 1. AUTO-REGISTRO: Si viene un ID, verificamos si existe en Traccar
    if (deviceId) {
      try {
        const existingDevices = await fetchTraccar(`/devices?uniqueId=${deviceId}`, { systemRequest: true });
        if (!existingDevices || existingDevices.length === 0) {
          console.log(`[PROXY] Auto-registrando nuevo dispositivo: ${deviceId}`);
          
          // Aseguramos que el grupo "Vendedores" exista dinámicamente
          const groupId = await ensureGroupExists("Vendedores", true) || 1;

          await fetchTraccar('/devices', {
            method: 'POST',
            body: JSON.stringify({
              name: `Vendedor Nuevo (${deviceId})`,
              uniqueId: deviceId,
              groupId: groupId
            }),
            systemRequest: true
          });
        }
      } catch (checkError) {
        console.error("[PROXY] Error al verificar/crear el dispositivo:", checkError);
      }
    }

    // 2. Reenviar al puerto 5055 de Traccar.
    // Traccar (OsmAnd) lee mejor los parámetros si están directamente en la URL.
    const traccarUrl = `http://localhost:5055/?${searchParams.toString()}`;
    
    // Siempre lo enviamos como POST o GET, pero con los parámetros ya en la URL
    const traccarResponse = await fetch(traccarUrl, {
      method: request.method,
      // Ya no enviamos el body porque lo movimos a la URL
    });

    if (traccarResponse.ok) {
      return new NextResponse("OK", { status: 200 });
    } else {
      console.error(`[PROXY] Traccar devolvió error: ${traccarResponse.status}`);
      return new NextResponse("Error de Traccar", { status: traccarResponse.status });
    }
  } catch (error) {
    console.error("[PROXY] Error crítico:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return forwardToTraccar(request);
}

export async function POST(request: NextRequest) {
  return forwardToTraccar(request);
}
