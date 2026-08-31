import { TraccarTrackingError } from "../services/traccar-tracking.js";
import type { Response } from "express";

export const positiveId = (value: unknown): string => {
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
        throw new TraccarTrackingError(400, 'El id debe ser un entero positivo');
    }
    return value;
};

export const dateRange = (from: unknown, to: unknown): URLSearchParams => {
    const parse = (value: unknown): number => {
        if (typeof value !== 'string') throw new TraccarTrackingError(400, 'from y to son obligatorios');
        const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
        const time = Date.parse(value);
        if (!match || !Number.isFinite(time)) throw new TraccarTrackingError(400, 'Use fechas ISO 8601 con zona horaria');
        const [, year, month, day, hour, minute, second, zone] = match;
        const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
        if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > days ||
            Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 ||
            (zone !== 'Z' && (Number(zone!.slice(1, 3)) > 23 || Number(zone!.slice(4)) > 59))) {
            throw new TraccarTrackingError(400, 'Fecha inválida');
        }
        return time;
    };
    const start = parse(from);
    const end = parse(to);
    if (start >= end) throw new TraccarTrackingError(400, 'from debe ser anterior a to');
    if (end - start > 31 * 86400000) throw new TraccarTrackingError(400, 'El rango máximo es de 31 días');
    return new URLSearchParams({ from: new Date(start).toISOString(), to: new Date(end).toISOString() });
};

export const trackingError = (res: Response, error: unknown) => res.status(
    error instanceof TraccarTrackingError ? error.status : 500,
).json({ error: error instanceof TraccarTrackingError ? error.message : 'Error al consultar el seguimiento' });

export const allowedQuery = (query: Record<string, unknown>, keys: string[]) => {
    if (Object.keys(query).some(key => !keys.includes(key))) {
        throw new TraccarTrackingError(400, 'Parámetro de consulta no admitido');
    }
};
