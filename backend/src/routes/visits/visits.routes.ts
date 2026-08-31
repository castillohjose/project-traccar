import { Router } from "express";
import { VisitsController } from "../../controllers/visits/visits.controller.js";
import { TraccarApiVisits } from "../../services/traccar-visits.js";

export class VisitsRoutes {
    static get routes(): Router {
        const router = Router();
        const controller = new VisitsController(new TraccarApiVisits());
        router.get('/', controller.getAll);
        return router;
    }
}
