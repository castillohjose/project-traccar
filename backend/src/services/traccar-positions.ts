import { trackingRequest } from "./traccar-tracking.js";

export class TraccarApiPositions {
    getAll = async (cookie: string, query = new URLSearchParams()) => {
        return trackingRequest(`/positions${query.size ? '?' + query.toString() : ''}`, cookie);
    }
}
