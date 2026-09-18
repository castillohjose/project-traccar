import { Router } from "express";
import { PositionsController } from "../../controllers/positions/positions.controller.js";
import { TraccarApiPositions } from "../../services/traccar-positions.js";
import { handleInputErrors, positionsQueryValidator } from "../../middlewares/express-validator/index.js";

export class PositionsRoutes {
    static get routes(): Router {
        const router = Router();
        const controller = new PositionsController(new TraccarApiPositions());
        router.get('/', positionsQueryValidator, handleInputErrors, controller.getAll);
        return router;
    }
}
