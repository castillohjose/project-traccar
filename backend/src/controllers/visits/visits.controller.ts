import type { Request, Response } from "express";
import type { TraccarApiVisits } from "../../services/traccar-visits.js";
import { TraccarTrackingError } from "../../services/traccar-tracking.js";
import { allowedQuery, dateRange, positiveId, trackingError } from "../tracking-query.js";

export class VisitsController {
    constructor(private readonly traccarApiVisits: TraccarApiVisits) { }

    getAll = async (req: Request, res: Response) => {
        try {
            allowedQuery(req.query, ['deviceId', 'geofenceId', 'from', 'to', 'minimumDurationSeconds']);
            const query = dateRange(req.query.from, req.query.to);
            const ids = Array.isArray(req.query.deviceId) ? req.query.deviceId : [req.query.deviceId];
            for (const id of ids) query.append('deviceId', positiveId(id));
            const geofenceId = req.query.geofenceId === undefined ? undefined : Number(positiveId(req.query.geofenceId));
            const raw = req.query.minimumDurationSeconds ?? '300';
            if (typeof raw !== 'string' || !/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
                throw new TraccarTrackingError(400, 'minimumDurationSeconds debe ser un entero no negativo');
            }
            return res.json(await this.traccarApiVisits.getAll(req.sessionCookie!, query, Number(raw), geofenceId));
        } catch (error) {
            return trackingError(res, error);
        }
    }
}
