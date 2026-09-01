import { body } from "express-validator";

export const createSessionValidator = [
    body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email valido'),
    body('password')
    .notEmpty().withMessage('El password es requerido')
] 