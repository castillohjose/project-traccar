import { Router } from "express";
import { DevicesController } from "../../controllers/index.js";
import { TraccarApiDevices } from "../../services/traccar-devices.js";
import { deviceIdValidator, deviceListValidator, devicePayloadValidator, handleInputErrors } from "../../middlewares/express-validator/index.js";


class DevicesRoutes {

    static get routes(): Router {

        const router = Router()
        const devicesController = new DevicesController(new TraccarApiDevices())



        router.post('/', devicePayloadValidator, handleInputErrors, devicesController.create)
        router.get('/', deviceListValidator, handleInputErrors, devicesController.getAll)
        router.get("/:id", deviceIdValidator, handleInputErrors, devicesController.getById)
        router.put('/:id', deviceIdValidator, devicePayloadValidator, handleInputErrors, devicesController.update)
        router.delete('/:id', deviceIdValidator, handleInputErrors, devicesController.delete)



        return router
    }


}

export {
    DevicesRoutes
}
