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

    private mapGeofence = (data: GeofenceTraccar & { latitude?: number; longitude?: number; radius?: number }): GeofenceTraccar => {
        const area = data.area ?? `CIRCLE (${data.latitude} ${data.longitude}, ${data.radius})`;
        const { latitude: _latitude, longitude: _longitude, radius: _radius, ...geofence } = data;
        return { ...geofence, area };
    }

    create = async (req: Request, res: Response) => {
        try {
            const geofence = this.mapGeofence(req.validated!.body as unknown as GeofenceTraccar & { latitude?: number; longitude?: number; radius?: number });
            return res.status(200).json(await this.traccarApiGeofences.create(geofence, req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    getAll = async (req: Request, res: Response) => {
        try {
            const filters = new URLSearchParams();
            for (const key of ['all', 'userId', 'deviceId', 'groupId', 'refresh', 'limit', 'offset', 'keyword']) {
                const value = req.validated!.query[key];
                if (value === undefined) continue;
                filters.append(key, String(value));
            }
            return res.status(200).json(await this.traccarApiGeofences.getAll(req.sessionCookie!, filters));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    getById = async (req: Request, res: Response) => {
        try {
            return res.status(200).json(await this.traccarApiGeofences.getById(Number(req.validated!.params.id), req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const id = Number(req.validated!.params.id);
            const geofence = this.mapGeofence(req.validated!.body as unknown as GeofenceTraccar & { latitude?: number; longitude?: number; radius?: number });
            return res.status(200).json(await this.traccarApiGeofences.update(id, geofence, req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            await this.traccarApiGeofences.delete(Number(req.validated!.params.id), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    assignUser = async (req: Request, res: Response) => {
        try {
            await this.traccarApiGeofences.assignUser(Number(req.validated!.params.id), Number(req.validated!.params.userId), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    assignDevice = async (req: Request, res: Response) => {
        try {
            await this.traccarApiGeofences.assignDevice(Number(req.validated!.params.id), Number(req.validated!.params.deviceId), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    unassignDevice = async (req: Request, res: Response) => {
        try {
            await this.traccarApiGeofences.unassignDevice(Number(req.validated!.params.id), Number(req.validated!.params.deviceId), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    unassignUser = async (req: Request, res: Response) => {
        try {
            await this.traccarApiGeofences.unassignUser(Number(req.validated!.params.id), Number(req.validated!.params.userId), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }
}
