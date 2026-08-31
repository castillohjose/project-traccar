import { Router } from "express";
import { GeofencesController } from "../../controllers/index.js";
import { TraccarApiGeofences } from "../../services/traccar-geofences.js";

export class GeofencesRoutes {
    static get routes(): Router {
        const router = Router();
        const geofencesController = new GeofencesController(new TraccarApiGeofences());

        router.post('/', geofencesController.create);
        router.get('/', geofencesController.getAll);
        router.get('/:id', geofencesController.getById);
        router.put('/:id', geofencesController.update);
        router.delete('/:id', geofencesController.delete);
        router.post('/:id/users/:userId', geofencesController.assignUser);
        router.post('/:id/devices/:deviceId', geofencesController.assignDevice);
        router.delete('/:id/devices/:deviceId', geofencesController.unassignDevice);
        router.delete('/:id/users/:userId', geofencesController.unassignUser);

        return router;
    }
}
