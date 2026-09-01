import { param, query } from 'express-validator';

export const positiveIdParam = (name: string) => param(name)
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER }).withMessage(`${name} debe ser un entero positivo`)
    .toInt();

export const optionalPositiveQuery = (name: string) => query(name).optional()
    .custom(value => {
        if (Array.isArray(value) || typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
            throw new Error(`${name} debe ser un entero positivo`);
        }
        return true;
    });

export const optionalRepeatedPositiveQuery = (name: string) => query(name).optional()
    .custom(value => {
        const values = Array.isArray(value) ? value : [value];
        if (!values.every(item => typeof item === 'string' && /^[1-9]\d*$/.test(item) && Number.isSafeInteger(Number(item)))) {
            throw new Error(`${name} debe contener enteros positivos`);
        }
        return true;
    });

export const optionalBooleanQuery = (name: string) => query(name).optional()
    .custom(value => typeof value === 'string' && ['true', 'false'].includes(value))
    .withMessage(`${name} debe ser true o false`);

export const isoDate = (name: 'from' | 'to') => query(name)
    .custom(value => typeof value === 'string').withMessage(`${name} no admite valores repetidos`)
    .bail().isISO8601({ strict: true, strictSeparator: true }).withMessage(`${name} debe ser una fecha ISO 8601 válida`)
    .bail().custom(value => {
        if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
            throw new Error(`${name} debe incluir zona horaria`);
        }
        return true;
    });

export const validDateRange = query('to').custom((to, { req }) => {
    const from = Date.parse(String(req.query?.from));
    const end = Date.parse(String(to));
    if (!Number.isFinite(from) || !Number.isFinite(end)) return true;
    if (from >= end) throw new Error('from debe ser anterior a to');
    if (end - from > 31 * 86400000) throw new Error('El rango máximo es de 31 días');
    return true;
});
