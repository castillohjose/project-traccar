import { envs } from "../config/envs.js";
import type { GeofenceTraccar } from "../types/index.js";

export class TraccarGeofencesError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
    }
}

export class TraccarApiGeofences {
    private url: string = `${envs.TRACAR_API_URL.replace(/\/$/, '')}/geofences`;

    private request = async (path: string, cookie: string, method = 'GET', body?: (GeofenceTraccar & { id?: number }) | { userId: number; geofenceId: number } | { deviceId: number; geofenceId: number }) => {
        let response: globalThis.Response;
        try {
            response = await fetch(path === '/permissions' ? `${envs.TRACAR_API_URL.replace(/\/$/, '')}/permissions` : `${this.url}${path}`, {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Cookie': `JSESSIONID=${cookie}`,
                },
                ...(body ? { body: JSON.stringify(body) } : {}),
                signal: AbortSignal.timeout(15000),
            });
        } catch {
            throw new TraccarGeofencesError(502, 'No se pudo conectar con Traccar');
        }

        if (!response.ok) {
            // No exponer stack traces ni detalles internos de Traccar.
            throw new TraccarGeofencesError(response.status, `Error de Traccar al gestionar geozonas (${response.status})`);
        }
        if (response.status === 204) return;
        try {
            return await response.json();
        } catch {
            throw new TraccarGeofencesError(502, 'Respuesta inválida de Traccar');
        }
    }

    create = async (geofence: GeofenceTraccar, cookie: string) => {
        return this.request('', cookie, 'POST', geofence);
    }

    getAll = async (cookie: string, filters = new URLSearchParams()) => {
        const query = filters.toString();
        return this.request(query ? `?${query}` : '', cookie);
    }

    getById = async (id: number, cookie: string) => {
        return this.request(`/${id}`, cookie);
    }

    update = async (id: number, geofence: GeofenceTraccar, cookie: string) => {
        return this.request(`/${id}`, cookie, 'PUT', { ...geofence, id });
    }

    delete = async (id: number, cookie: string) => {
        await this.request(`/${id}`, cookie, 'DELETE');
    }

    assignUser = async (id: number, userId: number, cookie: string) => {
        await this.request('/permissions', cookie, 'POST', { userId, geofenceId: id });
    }

    assignDevice = async (id: number, deviceId: number, cookie: string) => {
        await this.request('/permissions', cookie, 'POST', { deviceId, geofenceId: id });
    }

    unassignDevice = async (id: number, deviceId: number, cookie: string) => {
        await this.request('/permissions', cookie, 'DELETE', { deviceId, geofenceId: id });
    }

    unassignUser = async (id: number, userId: number, cookie: string) => {
        await this.request('/permissions', cookie, 'DELETE', { userId, geofenceId: id });
    }
}
