import { body, checkExact, query } from 'express-validator';
import { optionalPositiveQuery, positiveIdParam } from './common-validators.js';

const optionalStringOrNull = (field: string) => body(field).optional({ values: 'null' })
    .custom(value => value === null || typeof value === 'string').withMessage(`${field} debe ser texto o null`);
const optionalBoolean = (field: string) => body(field).optional()
    .custom(value => typeof value === 'boolean').withMessage(`${field} debe ser booleano`);

const commonPayload = [
    body('name').isString().withMessage('name debe ser texto').bail().trim().notEmpty().withMessage('name es requerido'),
    body('email').isString().withMessage('email debe ser texto').bail().trim().notEmpty().withMessage('email es requerido')
        .bail().isEmail().withMessage('email debe ser válido').normalizeEmail(),
    optionalStringOrNull('phone'), optionalStringOrNull('map'), optionalStringOrNull('coordinateFormat'), optionalStringOrNull('poiLayer'),
    ...['readonly', 'administrator', 'disabled', 'deviceReadonly', 'limitCommands', 'fixedEmail'].map(optionalBoolean),
    body('latitude').optional().custom(value => typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90)
        .withMessage('latitude debe estar entre -90 y 90'),
    body('longitude').optional().custom(value => typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180)
        .withMessage('longitude debe estar entre -180 y 180'),
    body('zoom').optional().custom(value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
        .withMessage('zoom debe ser un entero no negativo'),
    body('expirationTime').optional({ values: 'null' }).custom(value => value === null || (
        typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value))
    )).withMessage('expirationTime debe ser null o una fecha ISO 8601 con zona horaria'),
    ...['deviceLimit', 'userLimit'].map(field => body(field).optional()
        .custom(value => typeof value === 'number' && Number.isSafeInteger(value) && value >= -1)
        .withMessage(`${field} debe ser un entero mayor o igual a -1`)),
    body('attributes').optional().custom(value => value !== null && typeof value === 'object' && !Array.isArray(value))
        .withMessage('attributes debe ser un objeto'),
];

export const createUserValidator = [
    ...commonPayload,
    body('password').isString().withMessage('password debe ser texto').bail().notEmpty().withMessage('password es requerido'),
];
export const updateUserValidator = [
    ...commonPayload,
    body('password').optional().isString().withMessage('password debe ser texto').bail().notEmpty().withMessage('password no puede estar vacío'),
];
export const userRecordIdValidator = positiveIdParam('id');
export const userListValidator = checkExact([
    optionalPositiveQuery('userId'),
    query('limit').optional().isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).withMessage('limit debe ser un entero positivo'),
    query('offset').optional().isInt({ min: 0, max: Number.MAX_SAFE_INTEGER }).withMessage('offset debe ser un entero no negativo'),
    query('keyword').optional().isString().trim().notEmpty().withMessage('keyword debe contener texto'),
], { message: 'La consulta contiene parámetros no permitidos' });
