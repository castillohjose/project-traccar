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

    private getId = (req: Request): number => {
        const value = req.params.id;
        if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
            throw new TraccarDevicesError(400, 'El id debe ser un entero positivo');
        }
        return Number(value);
    }

    private getDevice = (body: unknown): DeviceTraccar => {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw new TraccarDevicesError(400, 'Debe enviar los datos del dispositivo');
        }
        const data = body as Record<string, unknown>;
        if (typeof data.name !== 'string' || !data.name.trim() || typeof data.uniqueId !== 'string' || !data.uniqueId.trim()) {
            throw new TraccarDevicesError(400, 'name y uniqueId son obligatorios y deben ser textos no vacíos');
        }
        const device: DeviceTraccar = { name: data.name.trim(), uniqueId: data.uniqueId.trim() };
        for (const field of ['phone', 'model', 'contact', 'category'] as const) {
            if (data[field] !== undefined) {
                if (typeof data[field] !== 'string') throw new TraccarDevicesError(400, `${field} debe ser texto`);
                device[field] = data[field];
            }
        }
        if (data.groupId !== undefined) {
            if (typeof data.groupId !== 'number' || !Number.isSafeInteger(data.groupId) || data.groupId < 0) {
                throw new TraccarDevicesError(400, 'groupId debe ser un entero no negativo');
            }
            device.groupId = data.groupId;
        }
        if (data.disabled !== undefined) {
            if (typeof data.disabled !== 'boolean') throw new TraccarDevicesError(400, 'disabled debe ser booleano');
            device.disabled = data.disabled;
        }
        if (data.attributes !== undefined) {
            if (!data.attributes || typeof data.attributes !== 'object' || Array.isArray(data.attributes)) {
                throw new TraccarDevicesError(400, 'attributes debe ser un objeto');
            }
            device.attributes = data.attributes as Record<string, unknown>;
        }
        return device;
    }

    create = async (req: Request, res: Response) => {
        try {
            const device = this.getDevice(req.body);
            return res.status(200).json(await this.traccarApiDevices.create(device, req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    getAll = async (req: Request, res: Response) => {
        try {
            const filters = new URLSearchParams();
            for (const key of ['all', 'userId', 'id', 'uniqueId', 'keyword', 'excludeAttributes', 'limit', 'offset']) {
                const value = req.query[key];
                if (value === undefined) continue;
                const values = Array.isArray(value) ? value : [value];
                if (values.length > 1 && key !== 'id' && key !== 'uniqueId') {
                    throw new TraccarDevicesError(400, `${key} no admite valores repetidos`);
                }
                for (const item of values) {
                    if (typeof item !== 'string' || !item.trim()) throw new TraccarDevicesError(400, `Filtro ${key} inválido`);
                    if (['all', 'excludeAttributes'].includes(key) && !['true', 'false'].includes(item)) {
                        throw new TraccarDevicesError(400, `${key} debe ser true o false`);
                    }
                    if (['userId', 'id', 'limit', 'offset'].includes(key) &&
                        (!/^\d+$/.test(item) || !Number.isSafeInteger(Number(item)) || Number(item) < (key === 'offset' ? 0 : 1))) {
                        throw new TraccarDevicesError(400, `Filtro numérico ${key} inválido`);
                    }
                    filters.append(key, item);
                }
            }
            return res.status(200).json(await this.traccarApiDevices.getAll(req.sessionCookie!, filters));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    getById = async (req: Request, res: Response) => {
        try {
            return res.status(200).json(await this.traccarApiDevices.getById(this.getId(req), req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const id = this.getId(req);
            const device = this.getDevice(req.body);
            return res.status(200).json(await this.traccarApiDevices.update(id, device, req.sessionCookie!));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            await this.traccarApiDevices.delete(this.getId(req), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) {
            return this.handleError(res, error);
        }
    }
}

