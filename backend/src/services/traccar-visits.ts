import { trackingRequest, TraccarTrackingError } from "./traccar-tracking.js";

interface GeofenceEvent {
    id: number;
    deviceId: number;
    geofenceId: number;
    type: 'geofenceEnter' | 'geofenceExit';
    eventTime: string;
}

export interface Visit {
    deviceId: number;
    geofenceId: number;
    arrival: string | null;
    departure: string | null;
    durationSeconds: number | null;
    meetsMinimumDuration: boolean | null;
    status: 'complete' | 'missing_entry' | 'missing_exit';
}

// No inventa entradas/salidas en los límites del período ni confirma atención comercial.
export const buildVisits = (events: unknown[], minimumSeconds: number): Visit[] => {
    const parsed: GeofenceEvent[] = [];
    for (const value of events) {
        if (!value || typeof value !== 'object') throw new TraccarTrackingError(502, 'Evento inválido de Traccar');
        const event = value as GeofenceEvent;
        if (event.type !== 'geofenceEnter' && event.type !== 'geofenceExit') continue;
        if (![event.id, event.deviceId, event.geofenceId].every(id => Number.isSafeInteger(id) && id > 0) ||
            typeof event.eventTime !== 'string' || !Number.isFinite(Date.parse(event.eventTime))) {
            throw new TraccarTrackingError(502, 'Evento de geozona inválido de Traccar');
        }
        parsed.push(event);
    }
    parsed.sort((a, b) => Date.parse(a.eventTime) - Date.parse(b.eventTime) || a.id - b.id);
    const pending = new Map<string, GeofenceEvent>();
    const seen = new Set<number>();
    const visits: Visit[] = [];
    const add = (entry: GeofenceEvent | undefined, exit: GeofenceEvent | undefined) => {
        const event = entry ?? exit!;
        const duration = entry && exit ? (Date.parse(exit.eventTime) - Date.parse(entry.eventTime)) / 1000 : null;
        visits.push({
            deviceId: event.deviceId, geofenceId: event.geofenceId,
            arrival: entry?.eventTime ?? null, departure: exit?.eventTime ?? null,
            durationSeconds: duration,
            meetsMinimumDuration: duration === null ? null : duration >= minimumSeconds,
            status: !entry ? 'missing_entry' : !exit ? 'missing_exit' : 'complete',
        });
    };
    for (const event of parsed) {
        if (seen.has(event.id)) continue;
        seen.add(event.id);
        const key = `${event.deviceId}:${event.geofenceId}`;
        const entry = pending.get(key);
        if (event.type === 'geofenceEnter') {
            // Dos entradas distintas pueden indicar una salida perdida; no sumar intervalos.
            if (entry) add(entry, undefined);
            pending.set(key, event);
        } else {
            add(entry, event);
            pending.delete(key);
        }
    }
    for (const entry of pending.values()) add(entry, undefined);
    return visits.sort((a, b) => Date.parse(a.arrival ?? a.departure!) - Date.parse(b.arrival ?? b.departure!));
};

export class TraccarApiVisits {
    getAll = async (cookie: string, query: URLSearchParams, minimumSeconds: number, geofenceId?: number) => {
        const upstream = new URLSearchParams(query);
        upstream.set('type', '%');
        const events = await trackingRequest(`/reports/events?${upstream}`, cookie);
        const visits = buildVisits(events, minimumSeconds).filter(visit =>
            query.getAll('deviceId').includes(String(visit.deviceId)) &&
            (geofenceId === undefined || visit.geofenceId === geofenceId));
        return { minimumDurationSeconds: minimumSeconds, visits };
    }
}
