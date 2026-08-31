import type { Request, Response } from "express";
import { TraccarGeofencesError, type TraccarApiGeofences } from "../../services/traccar-geofences.js";
import type { GeofenceTraccar } from "../../types/index.js";

export class GeofencesController {
    constructor(private readonly traccarApiGeofences: TraccarApiGeofences) { }

    private handleError = (res: Response, error: unknown) => {
        return res.status(error instanceof TraccarGeofencesError ? error.status : 500).json({
            error: error instanceof TraccarGeofencesError ? error.message : 'Error al gestionar la geozona',
        });
    }

    private getId = (value: unknown): number => {
        if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
            throw new TraccarGeofencesError(400, 'El id debe ser un entero positivo');
        }
        return Number(value);
    }

    private getGeofence = (body: unknown): GeofenceTraccar => {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw new TraccarGeofencesError(400, 'Debe enviar los datos de la geozona');
        }
        const data = body as Record<string, unknown>;
        if (typeof data.name !== 'string' || !data.name.trim()) {
            throw new TraccarGeofencesError(400, 'name es obligatorio y debe ser un texto no vacío');
        }
        let area: string;
        if (data.area !== undefined) {
            if (['latitude', 'longitude', 'radius'].some(key => data[key] !== undefined)) {
                throw new TraccarGeofencesError(400, 'Envíe area o latitude, longitude y radius, no ambos formatos');
            }
            if (typeof data.area !== 'string' || !data.area.trim()) {
                throw new TraccarGeofencesError(400, 'area debe ser un texto no vacío');
            }
            // La geometría nativa (círculo, polígono o línea) la valida Traccar.
            area = data.area.trim();
        } else {
            const { latitude, longitude, radius } = data;
            if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
                throw new TraccarGeofencesError(400, 'latitude debe ser un número entre -90 y 90');
            }
            if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
                throw new TraccarGeofencesError(400, 'longitude debe ser un número entre -180 y 180');
            }
            if (typeof radius !== 'number' || !Number.isFinite(radius) || radius <= 0) {
                throw new TraccarGeofencesError(400, 'radius debe ser un número positivo en metros');
            }
            // Traccar usa latitud longitud, no el orden GeoJSON.
            area = `CIRCLE (${latitude} ${longitude}, ${radius})`;
        }
        const geofence: GeofenceTraccar = { name: data.name.trim(), area };
        if (data.description !== undefined) {
            if (typeof data.description !== 'string') throw new TraccarGeofencesError(400, 'description debe ser texto');
            geofence.description = data.description;
        }
        if (data.calendarId !== undefined) {
            if (typeof data.calendarId !== 'number' || !Number.isSafeInteger(data.calendarId) || data.calendarId < 0) {
                throw new TraccarGeofencesError(400, 'calendarId debe ser un entero no negativo');
            }
            geofence.calendarId = data.calendarId;
        }
        if (data.attributes !== undefined) {
            if (!data.attributes || typeof data.attributes !== 'object' || Array.isArray(data.attributes)) {
                throw new TraccarGeofencesError(400, 'attributes debe ser un objeto');
            }
            geofence.attributes = data.attributes as Record<string, unknown>;
        }
        return geofence;
    }

    create = async (req: Request, res: Response) => {
        try {
            const geofence = this.getGeofence(req.body);
            return res.status(200).json(await this.traccarApiGeofences.create(geofence, req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    getAll = async (req: Request, res: Response) => {
        try {
            const filters = new URLSearchParams();
            for (const key of ['all', 'userId', 'deviceId', 'groupId', 'refresh', 'limit', 'offset', 'keyword']) {
                const value = req.query[key];
                if (value === undefined) continue;
                if (typeof value !== 'string' || !value.trim()) throw new TraccarGeofencesError(400, `Filtro ${key} inválido`);
                if (['all', 'refresh'].includes(key) && !['true', 'false'].includes(value)) {
                    throw new TraccarGeofencesError(400, `${key} debe ser true o false`);
                }
                if (['userId', 'deviceId', 'groupId', 'limit', 'offset'].includes(key) &&
                    (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < (key === 'offset' ? 0 : 1))) {
                    throw new TraccarGeofencesError(400, `Filtro numérico ${key} inválido`);
                }
                filters.append(key, value);
            }
            return res.status(200).json(await this.traccarApiGeofences.getAll(req.sessionCookie!, filters));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    getById = async (req: Request, res: Response) => {
        try {
            return res.status(200).json(await this.traccarApiGeofences.getById(this.getId(req.params.id), req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const id = this.getId(req.params.id);
            const geofence = this.getGeofence(req.body);
            return res.status(200).json(await this.traccarApiGeofences.update(id, geofence, req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            await this.traccarApiGeofences.delete(this.getId(req.params.id), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    assignUser = async (req: Request, res: Response) => {
        try {
            await this.traccarApiGeofences.assignUser(this.getId(req.params.id), this.getId(req.params.userId), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    assignDevice = async (req: Request, res: Response) => {
        try {
            await this.traccarApiGeofences.assignDevice(this.getId(req.params.id), this.getId(req.params.deviceId), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    unassignDevice = async (req: Request, res: Response) => {
        try {
            await this.traccarApiGeofences.unassignDevice(this.getId(req.params.id), this.getId(req.params.deviceId), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    unassignUser = async (req: Request, res: Response) => {
        try {
            await this.traccarApiGeofences.unassignUser(this.getId(req.params.id), this.getId(req.params.userId), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }
}
