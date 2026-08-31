import { envs } from "../config/envs.js";

export class TraccarTrackingError extends Error {
    constructor(public readonly status: number, message: string) { super(message); }
}

// Compartido por los servicios de posiciones y visitas; siempre usa la sesión solicitante.
export const trackingRequest = async (path: string, cookie: string): Promise<unknown[]> => {
    let response: Response;
    try {
        response = await fetch(`${envs.TRACAR_API_URL.replace(/\/$/, '')}${path}`, {
            headers: { Accept: 'application/json', Cookie: `JSESSIONID=${cookie}` },
            signal: AbortSignal.timeout(15000),
        });
    } catch {
        throw new TraccarTrackingError(502, 'No se pudo conectar con Traccar');
    }
    if (!response.ok) throw new TraccarTrackingError(response.status, `Error de Traccar (${response.status})`);
    try {
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error('Expected array');
        return data;
    } catch {
        throw new TraccarTrackingError(502, 'Respuesta inválida de Traccar');
    }
};
