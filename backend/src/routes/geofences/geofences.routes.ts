import { Router } from "express";
import { GeofencesController } from "../../controllers/index.js";
import { TraccarApiGeofences } from "../../services/traccar-geofences.js";
import { geofenceIdValidator, geofenceListValidator, geofencePayloadValidator, handleInputErrors, linkedDeviceIdValidator, userIdValidator } from "../../middlewares/express-validator/index.js";

export class GeofencesRoutes {
    static get routes(): Router {
        const router = Router();
        const geofencesController = new GeofencesController(new TraccarApiGeofences());

        router.post('/', geofencePayloadValidator, handleInputErrors, geofencesController.create);
        router.get('/', geofenceListValidator, handleInputErrors, geofencesController.getAll);
        router.get('/:id', geofenceIdValidator, handleInputErrors, geofencesController.getById);
        router.put('/:id', geofenceIdValidator, geofencePayloadValidator, handleInputErrors, geofencesController.update);
        router.delete('/:id', geofenceIdValidator, handleInputErrors, geofencesController.delete);
        router.post('/:id/users/:userId', geofenceIdValidator, userIdValidator, handleInputErrors, geofencesController.assignUser);
        router.post('/:id/devices/:deviceId', geofenceIdValidator, linkedDeviceIdValidator, handleInputErrors, geofencesController.assignDevice);
        router.delete('/:id/devices/:deviceId', geofenceIdValidator, linkedDeviceIdValidator, handleInputErrors, geofencesController.unassignDevice);
        router.delete('/:id/users/:userId', geofenceIdValidator, userIdValidator, handleInputErrors, geofencesController.unassignUser);

        return router;
    }
}
