import type { NextFunction, Request, Response } from 'express';
import { matchedData, validationResult } from 'express-validator';

declare global {
    namespace Express {
        interface Request {
            validated?: {
                body: Record<string, unknown>;
                params: Record<string, unknown>;
                query: Record<string, unknown>;
            };
        }
    }
}

export const handleInputErrors = (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const seen = new Set<string>();
        const errors = result.array({ onlyFirstError: true }).flatMap(error => {
            const field = error.type === 'field' ? error.path : 'request';
            const key = `${field}:${error.msg}`;
            if (seen.has(key)) return [];
            seen.add(key);
            return [{ field, message: String(error.msg) }];
        });
        return res.status(400).json({ ok: false, message: 'Datos de entrada inválidos', errors });
    }

    const clean = (data: Record<string, unknown>) => Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
    );
    req.validated = {
        body: clean(matchedData(req, { locations: ['body'] })),
        params: clean(matchedData(req, { locations: ['params'] })),
        query: clean(matchedData(req, { locations: ['query'] })),
    };
    next();
};
