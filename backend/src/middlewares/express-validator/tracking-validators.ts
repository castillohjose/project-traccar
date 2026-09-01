import { checkExact, query } from 'express-validator';
import { isoDate, optionalPositiveQuery, optionalRepeatedPositiveQuery, validDateRange } from './common-validators.js';

export const positionsQueryValidator = checkExact([
    optionalPositiveQuery('deviceId'),
    query('deviceId').if((_value, { req }) => Object.keys(req.query ?? {}).length > 0).exists().withMessage('deviceId, from y to deben enviarse juntos'),
    query('from').if((_value, { req }) => Object.keys(req.query ?? {}).length > 0).exists().withMessage('deviceId, from y to deben enviarse juntos')
        .bail().custom(value => typeof value === 'string').withMessage('from no admite valores repetidos')
        .bail().isISO8601({ strict: true, strictSeparator: true }).withMessage('from debe ser una fecha ISO 8601 válida')
        .bail().custom(value => /(Z|[+-]\d{2}:\d{2})$/.test(value)).withMessage('from debe incluir zona horaria'),
    query('to').if((_value, { req }) => Object.keys(req.query ?? {}).length > 0).exists().withMessage('deviceId, from y to deben enviarse juntos')
        .bail().custom(value => typeof value === 'string').withMessage('to no admite valores repetidos')
        .bail().isISO8601({ strict: true, strictSeparator: true }).withMessage('to debe ser una fecha ISO 8601 válida')
        .bail().custom(value => /(Z|[+-]\d{2}:\d{2})$/.test(value)).withMessage('to debe incluir zona horaria'),
    validDateRange.optional(),
], { message: 'La consulta contiene parámetros no permitidos' });

export const visitsQueryValidator = checkExact([
    optionalRepeatedPositiveQuery('deviceId'),
    query('deviceId').exists().withMessage('deviceId es requerido'),
    optionalPositiveQuery('geofenceId'), isoDate('from'), isoDate('to'), validDateRange,
    query('minimumDurationSeconds').optional().isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
        .withMessage('minimumDurationSeconds debe ser un entero no negativo'),
], { message: 'La consulta contiene parámetros no permitidos' });
