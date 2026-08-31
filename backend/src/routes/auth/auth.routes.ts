import { Router } from "express";
import { AuthController } from "../../controllers/auth/auth.controller.js";
import { TraccarApiSession } from "../../services/traccar-session.js";
import { extractTraccarCookie } from "../../middlewares/extract-traccar-cookie.js";


class AuthRoutes {

    static get routes(): Router {

        const router = Router()
        const authController = new AuthController(new TraccarApiSession())


        router.post('/', authController.login)
        router.get("/", extractTraccarCookie, authController.getUser)
        router.delete('/', extractTraccarCookie, authController.logout)

        return router
    }


}

export {
    AuthRoutes
}