import { envs } from "../config/envs.js";
import type { DeviceTraccar } from "../types/index.js";

export class TraccarDevicesError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
    }
}

export class TraccarApiDevices {
    private url: string = `${envs.TRACAR_API_URL.replace(/\/$/, '')}/devices`;

    private request = async (path: string, cookie: string, method = 'GET', device?: DeviceTraccar & { id?: number }) => {
        let response: globalThis.Response;
        try {
            response = await fetch(`${this.url}${path}`, {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Cookie': `JSESSIONID=${cookie}`,
                },
                ...(device ? { body: JSON.stringify(device) } : {}),
                signal: AbortSignal.timeout(15000),
            });
        } catch {
            throw new TraccarDevicesError(502, 'No se pudo conectar con Traccar');
        }

        if (!response.ok) {
            // No exponer stack traces ni detalles internos de Traccar.
            throw new TraccarDevicesError(response.status, `Error de Traccar al gestionar dispositivos (${response.status})`);
        }
        if (response.status === 204) return;
        try {
            return await response.json();
        } catch {
            throw new TraccarDevicesError(502, 'Respuesta inválida de Traccar');
        }
    }

    create = async (device: DeviceTraccar, cookie: string) => {
        return this.request('', cookie, 'POST', device);
    }

    getAll = async (cookie: string, filters = new URLSearchParams()) => {
        const query = filters.toString();
        return this.request(query ? `?${query}` : '', cookie);
    }

    getById = async (id: number, cookie: string) => {
        return this.request(`/${id}`, cookie);
    }

    update = async (id: number, device: DeviceTraccar, cookie: string) => {
        return this.request(`/${id}`, cookie, 'PUT', { ...device, id });
    }

    delete = async (id: number, cookie: string) => {
        await this.request(`/${id}`, cookie, 'DELETE');
    }
}
