import type { Request, Response } from "express";
import type { TraccarApiPositions } from "../../services/traccar-positions.js";
import { allowedQuery, dateRange, positiveId, trackingError } from "../tracking-query.js";

export class PositionsController {
    constructor(private readonly traccarApiPositions: TraccarApiPositions) { }

    getAll = async (req: Request, res: Response) => {
        try {
            allowedQuery(req.query, ['deviceId', 'from', 'to']);
            let query = new URLSearchParams();
            // Sin parámetros devuelve las últimas posiciones conocidas accesibles.
            if (Object.keys(req.query).length) {
                const deviceId = positiveId(req.query.deviceId);
                query = dateRange(req.query.from, req.query.to);
                query.set('deviceId', deviceId);
            }
            return res.json(await this.traccarApiPositions.getAll(req.sessionCookie!, query));
        } catch (error) {
            return trackingError(res, error);
        }
    }
}
