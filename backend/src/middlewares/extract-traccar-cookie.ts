import type { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Request {
            sessionCookie?: string;
        }
    }
}

export const extractTraccarCookie = (req: Request, res: Response, next: NextFunction) => {
    req.sessionCookie = req.cookies.JSESSIONID

    if (!req.sessionCookie) {
        return res.status(401).json({
            message: 'No autorizado'
        })
    }
    next();
};