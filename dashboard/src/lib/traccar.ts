import { cookies } from 'next/headers';
import fs from 'fs';

const TRACCAR_API_URL = process.env.TRACCAR_API_URL || "http://localhost:8082/api";

export interface FetchTraccarOptions extends RequestInit {
  systemRequest?: boolean;
}

export async function fetchTraccar(endpoint: string, options: FetchTraccarOptions = {}) {
  const url = `${TRACCAR_API_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  
  if (options.systemRequest) {
    // Intentar leer las credenciales del Robot desde el archivo local de configuración
    let user = process.env.TRACCAR_API_USER || 'admin';
    let pass = process.env.TRACCAR_API_PASS || 'admin';
    
    try {
      const configPath = '/app/backups/system-config.json';
      if (fs.existsSync(configPath)) {
        const rawData = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(rawData);
        if (config.TRACCAR_API_USER && config.TRACCAR_API_PASS) {
          user = config.TRACCAR_API_USER;
          pass = config.TRACCAR_API_PASS;
        }
      }
    } catch (e) {
      console.warn('[ROBOT] No se pudo leer el archivo de config, usando defaults o .env');
    }

    const basicAuth = Buffer.from(`${user}:${pass}`).toString('base64');
    headers.set('Authorization', `Basic ${basicAuth}`);
  } else {
    // Extraer el pase VIP (cookie) del usuario logueado actualmente
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('traccar_session');
    
    if (authCookie && authCookie.value) {
      headers.set('Cookie', `JSESSIONID=${authCookie.value}`);
    } else {
      console.warn(`[API] Intento de acceso a ${endpoint} sin cookie de sesión`);
    }
  }

  // Si no se especifica el tipo de contenido y es JSON, se agrega por defecto
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Traccar API error: ${response.statusText}`);
  }

  // Traccar a veces devuelve vacío en lugar de JSON en ciertas rutas (como DELETE o permisos)
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Busca si un Grupo existe por nombre, y si no, lo crea de forma transparente.
 * Si systemRequest es true, usa credenciales de Admin (Robot), útil para procesos en segundo plano.
 */
export async function ensureGroupExists(groupName: string, systemRequest: boolean = false): Promise<number | null> {
  try {
    const groups = await fetchTraccar('/groups?all=true', { systemRequest });
    let group = Array.isArray(groups) ? groups.find((g: any) => g.name === groupName) : null;
    
    if (!group) {
      group = await fetchTraccar('/groups', {
        method: 'POST',
        systemRequest,
        body: JSON.stringify({ name: groupName })
      });
    }
    
    return group ? group.id : null;
  } catch (error) {
    console.error(`Error ensuring group ${groupName} exists:`, error);
    return null;
  }
}
