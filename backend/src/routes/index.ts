
import { Router } from "express";
import { AuthRoutes } from "./auth/auth.routes.js";
import { DevicesRoutes } from "./devices/devices.routes.js";
import { GeofencesRoutes } from "./geofences/geofences.routes.js";
import { PositionsRoutes } from "./positions/positions.routes.js";
import { VisitsRoutes } from "./visits/visits.routes.js";
import { UsersRoutes } from "./users/users.routes.js";
import { extractTraccarCookie } from "../middlewares/extract-traccar-cookie.js";

export class AppRoutes {

    static get routes(): Router {

        const router = Router();

        router.use('/session', AuthRoutes.routes);
        router.use('/devices', extractTraccarCookie, DevicesRoutes.routes)
        router.use('/geofences', extractTraccarCookie, GeofencesRoutes.routes)
        router.use('/positions', extractTraccarCookie, PositionsRoutes.routes)
        router.use('/visits', extractTraccarCookie, VisitsRoutes.routes)
        router.use('/users', extractTraccarCookie, UsersRoutes.routes)


        return router;
    }
}
