import type { NextFunction, Request, Response } from 'express';

export const handleJsonErrors = (error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
        return res.status(400).json({
            ok: false,
            message: 'Datos de entrada inválidos',
            errors: [{ field: 'body', message: 'El cuerpo debe contener un JSON válido' }],
        });
    }
    next(error);
};
