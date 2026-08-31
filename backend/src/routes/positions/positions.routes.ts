import { Router } from "express";
import { PositionsController } from "../../controllers/positions/positions.controller.js";
import { TraccarApiPositions } from "../../services/traccar-positions.js";

export class PositionsRoutes {
    static get routes(): Router {
        const router = Router();
        const controller = new PositionsController(new TraccarApiPositions());
        router.get('/', controller.getAll);
        return router;
    }
}
