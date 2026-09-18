import { envs } from '../config/envs.js';
import type { UserTraccar } from '../types/index.js';

export class TraccarUsersError extends Error {
    constructor(public readonly status: number, message: string) { super(message); }
}

const removePassword = (data: unknown): unknown => {
    if (Array.isArray(data)) return data.map(removePassword);
    if (!data || typeof data !== 'object') return data;
    const { password: _password, ...user } = data as Record<string, unknown>;
    return user;
};

export class TraccarApiUsers {
    private readonly url = `${envs.TRACAR_API_URL.replace(/\/$/, '')}/users`;

    private request = async (path: string, cookie: string, method = 'GET', user?: UserTraccar & { id?: number }) => {
        let response: Response;
        try {
            response = await fetch(`${this.url}${path}`, {
                method,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Cookie: `JSESSIONID=${cookie}`,
                },
                ...(user ? { body: JSON.stringify(user) } : {}),
                signal: AbortSignal.timeout(15000),
            });
        } catch {
            throw new TraccarUsersError(502, 'No se pudo conectar con Traccar');
        }
        if (!response.ok) {
            throw new TraccarUsersError(response.status, `Error de Traccar al gestionar usuarios (${response.status})`);
        }
        if (response.status === 204) return;
        try {
            return removePassword(await response.json());
        } catch {
            throw new TraccarUsersError(502, 'Respuesta inválida de Traccar');
        }
    };

    create = (user: UserTraccar, cookie: string) => this.request('', cookie, 'POST', user);
    getAll = (cookie: string, filters = new URLSearchParams()) => {
        const query = filters.toString();
        return this.request(query ? `?${query}` : '', cookie);
    };
    getById = (id: number, cookie: string) => this.request(`/${id}`, cookie);
    update = (id: number, user: UserTraccar, cookie: string) => this.request(`/${id}`, cookie, 'PUT', { ...user, id });
    delete = async (id: number, cookie: string) => { await this.request(`/${id}`, cookie, 'DELETE'); };
}
