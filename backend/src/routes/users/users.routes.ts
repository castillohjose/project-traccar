import { Router } from 'express';
import { UsersController } from '../../controllers/users/users.controller.js';
import { TraccarApiUsers } from '../../services/traccar-users.js';
import { createUserValidator, handleInputErrors, updateUserValidator, userRecordIdValidator, userListValidator } from '../../middlewares/express-validator/index.js';

export class UsersRoutes {
    static get routes(): Router {
        const router = Router();
        const controller = new UsersController(new TraccarApiUsers());
        router.post('/', createUserValidator, handleInputErrors, controller.create);
        router.get('/', userListValidator, handleInputErrors, controller.getAll);
        router.get('/:id', userRecordIdValidator, handleInputErrors, controller.getById);
        router.put('/:id', userRecordIdValidator, updateUserValidator, handleInputErrors, controller.update);
        router.delete('/:id', userRecordIdValidator, handleInputErrors, controller.delete);
        return router;
    }
}
