import { body, checkExact } from 'express-validator';

export const createSessionValidator = checkExact([
    body('email').trim().notEmpty().withMessage('El email es requerido')
        .bail().isEmail().withMessage('Debe ser un email válido').normalizeEmail(),
    body('password').isString().withMessage('El password debe ser texto')
        .bail().notEmpty().withMessage('El password es requerido'),
], { message: 'El cuerpo contiene campos no permitidos' });
