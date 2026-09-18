import { body, checkExact, query } from 'express-validator';
import { optionalBooleanQuery, optionalPositiveQuery, positiveIdParam } from './common-validators.js';

const geofenceBody = [
    body('name').isString().withMessage('name debe ser texto').bail().trim().notEmpty().withMessage('name es requerido'),
    body('area').optional().isString().withMessage('area debe ser texto').bail().trim().notEmpty().withMessage('area no puede estar vacía'),
    body('latitude').optional().custom(value => typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90)
        .withMessage('latitude debe estar entre -90 y 90'),
    body('longitude').optional().custom(value => typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180)
        .withMessage('longitude debe estar entre -180 y 180'),
    body('radius').optional().custom(value => typeof value === 'number' && Number.isFinite(value) && value > 0)
        .withMessage('radius debe ser positivo'),
    body('name').custom((_value, { req }) => {
        const hasArea = req.body?.area !== undefined;
        const count = ['latitude', 'longitude', 'radius'].filter(field => req.body?.[field] !== undefined).length;
        if (hasArea && count) throw new Error('Envíe area o latitude, longitude y radius, no ambos formatos');
        if (!hasArea && count !== 3) throw new Error('latitude, longitude y radius son obligatorios cuando no se envía area');
        return true;
    }),
    body('description').optional().isString().withMessage('description debe ser texto'),
    body('calendarId').optional().custom(value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
        .withMessage('calendarId debe ser un entero no negativo'),
    body('attributes').optional().custom(value => value !== null && typeof value === 'object' && !Array.isArray(value))
        .withMessage('attributes debe ser un objeto'),
];

export const geofencePayloadValidator = geofenceBody;
export const geofenceIdValidator = positiveIdParam('id');
export const userIdValidator = positiveIdParam('userId');
export const linkedDeviceIdValidator = positiveIdParam('deviceId');
export const geofenceListValidator = checkExact([
    optionalBooleanQuery('all'), optionalPositiveQuery('userId'), optionalPositiveQuery('deviceId'),
    optionalPositiveQuery('groupId'), optionalBooleanQuery('refresh'),
    query('limit').optional().isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).withMessage('limit debe ser un entero positivo'),
    query('offset').optional().isInt({ min: 0, max: Number.MAX_SAFE_INTEGER }).withMessage('offset debe ser un entero no negativo'),
    query('keyword').optional().isString().trim().notEmpty().withMessage('keyword debe contener texto'),
], { message: 'La consulta contiene parámetros no permitidos' });
