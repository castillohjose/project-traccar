const TRACCAR_API_URL = "http://localhost:8082/api";
const TRACCAR_API_USER = "admin@greenpack.com";
const TRACCAR_API_PASS = "admin";

export async function fetchTraccar(endpoint: string, options: RequestInit = {}) {
  const url = `${TRACCAR_API_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  
  // Traccar requires Basic Auth
  headers.set('Authorization', 'Basic ' + Buffer.from(`${TRACCAR_API_USER}:${TRACCAR_API_PASS}`).toString('base64'));
  headers.set('Accept', 'application/json');
  if (options.method && options.method !== 'GET' && !headers.has('Content-Type')) {
     headers.set('Content-Type', 'application/json');
  }

  console.log(`[DEBUG] Fetching ${url} with User: '${TRACCAR_API_USER}', Pass: '${TRACCAR_API_PASS}'`);


  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store'
  });

  if (!response.ok) {
    console.error(`Traccar API Error: ${response.status} ${response.statusText}`, await response.text());
    throw new Error(`Traccar API error: ${response.statusText}`);
  }

  if (response.status !== 204) {
    return response.json();
  }
  return null;
}
