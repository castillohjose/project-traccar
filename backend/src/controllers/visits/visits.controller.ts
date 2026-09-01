import type { Request, Response } from "express";
import type { TraccarApiVisits } from "../../services/traccar-visits.js";
import { trackingError } from "../tracking-query.js";

export class VisitsController {
    constructor(private readonly traccarApiVisits: TraccarApiVisits) { }

    getAll = async (req: Request, res: Response) => {
        try {
            const filters = req.validated!.query;
            const query = new URLSearchParams({
                from: new Date(String(filters.from)).toISOString(),
                to: new Date(String(filters.to)).toISOString(),
            });
            const ids = Array.isArray(filters.deviceId) ? filters.deviceId : [filters.deviceId];
            for (const id of ids) query.append('deviceId', String(id));
            const geofenceId = filters.geofenceId === undefined ? undefined : Number(filters.geofenceId);
            const raw = filters.minimumDurationSeconds ?? '300';
            return res.json(await this.traccarApiVisits.getAll(req.sessionCookie!, query, Number(raw), geofenceId));
        } catch (error) {
            return trackingError(res, error);
        }
    }
}
