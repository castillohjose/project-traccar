import type { Request, Response } from "express";
import type { TraccarApiPositions } from "../../services/traccar-positions.js";
import { trackingError } from "../tracking-query.js";

export class PositionsController {
    constructor(private readonly traccarApiPositions: TraccarApiPositions) { }

    getAll = async (req: Request, res: Response) => {
        try {
            let query = new URLSearchParams();
            // Sin parámetros devuelve las últimas posiciones conocidas accesibles.
            const filters = req.validated!.query;
            if (Object.keys(filters).length) {
                query = new URLSearchParams({
                    deviceId: String(filters.deviceId),
                    from: new Date(String(filters.from)).toISOString(),
                    to: new Date(String(filters.to)).toISOString(),
                });
            }
            return res.json(await this.traccarApiPositions.getAll(req.sessionCookie!, query));
        } catch (error) {
            return trackingError(res, error);
        }
    }
}
