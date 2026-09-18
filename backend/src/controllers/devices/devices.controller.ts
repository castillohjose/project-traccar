import type { Request, Response } from "express";
import { TraccarDevicesError, type TraccarApiDevices } from "../../services/traccar-devices.js";
import type { DeviceTraccar } from "../../types/index.js";

export class DevicesController {
    constructor(private readonly traccarApiDevices: TraccarApiDevices) { }

    private handleError = (res: Response, error: unknown) => {
        return res.status(error instanceof TraccarDevicesError ? error.status : 500).json({
            error: error instanceof TraccarDevicesError ? error.message : 'Error al gestionar el dispositivo',
        });
    }

    create = async (req: Request, res: Response) => {
        try {
            const device = req.validated!.body as unknown as DeviceTraccar;
            return res.status(200).json(await this.traccarApiDevices.create(device, req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    getAll = async (req: Request, res: Response) => {
        try {
            const filters = new URLSearchParams();
            for (const key of ['all', 'userId', 'id', 'uniqueId', 'keyword', 'excludeAttributes', 'limit', 'offset']) {
                const value = req.validated!.query[key];
                if (value === undefined) continue;
                const values = Array.isArray(value) ? value : [value];
                for (const item of values) {
                    filters.append(key, String(item));
                }
            }
            return res.status(200).json(await this.traccarApiDevices.getAll(req.sessionCookie!, filters));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    getById = async (req: Request, res: Response) => {
        try {
            return res.status(200).json(await this.traccarApiDevices.getById(Number(req.validated!.params.id), req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const id = Number(req.validated!.params.id);
            const device = req.validated!.body as unknown as DeviceTraccar;
            return res.status(200).json(await this.traccarApiDevices.update(id, device, req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            await this.traccarApiDevices.delete(Number(req.validated!.params.id), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }
}
