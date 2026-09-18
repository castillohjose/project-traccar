import { body, checkExact, query } from 'express-validator';
import { optionalBooleanQuery, optionalPositiveQuery, optionalRepeatedPositiveQuery, positiveIdParam } from './common-validators.js';

const deviceBody = [
    body('name').isString().withMessage('name debe ser texto').bail().trim().notEmpty().withMessage('name es requerido'),
    body('uniqueId').isString().withMessage('uniqueId debe ser texto').bail().trim().notEmpty().withMessage('uniqueId es requerido'),
    ...['phone', 'model', 'contact', 'category'].map(field => body(field).optional().isString().withMessage(`${field} debe ser texto`)),
    body('groupId').optional().custom(value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
        .withMessage('groupId debe ser un entero no negativo'),
    body('disabled').optional().custom(value => typeof value === 'boolean').withMessage('disabled debe ser booleano'),
    body('attributes').optional().custom(value => value !== null && typeof value === 'object' && !Array.isArray(value))
        .withMessage('attributes debe ser un objeto'),
];

export const devicePayloadValidator = deviceBody;
export const deviceIdValidator = positiveIdParam('id');
export const deviceListValidator = checkExact([
    optionalBooleanQuery('all'), optionalPositiveQuery('userId'), optionalRepeatedPositiveQuery('id'),
    query('uniqueId').optional().custom(value => (Array.isArray(value) ? value : [value]).every(item => typeof item === 'string' && item.trim()))
        .withMessage('uniqueId debe contener texto'),
    query('keyword').optional().isString().trim().notEmpty().withMessage('keyword debe contener texto'),
    optionalBooleanQuery('excludeAttributes'),
    query('limit').optional().isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).withMessage('limit debe ser un entero positivo'),
    query('offset').optional().isInt({ min: 0, max: Number.MAX_SAFE_INTEGER }).withMessage('offset debe ser un entero no negativo'),
], { message: 'La consulta contiene parámetros no permitidos' });
