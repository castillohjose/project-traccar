import { Router } from "express";
import { DevicesController } from "../../controllers/index.js";
import { TraccarApiDevices } from "../../services/traccar-devices.js";


class DevicesRoutes {

    static get routes(): Router {

        const router = Router()
        const devicesController = new DevicesController(new TraccarApiDevices())



        router.post('/', devicesController.create)
        router.get('/', devicesController.getAll)
        router.get("/:id", devicesController.getById)
        router.put('/:id', devicesController.update)
        router.delete('/:id', devicesController.delete)



        return router
    }


}

export {
    DevicesRoutes
}
