import { TraccarTrackingError } from "../services/traccar-tracking.js";
import type { Response } from "express";

export const trackingError = (res: Response, error: unknown) => res.status(
    error instanceof TraccarTrackingError ? error.status : 500,
).json({ error: error instanceof TraccarTrackingError ? error.message : 'Error al consultar el seguimiento' });
