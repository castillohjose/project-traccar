import type { Request, Response } from 'express';
import { TraccarUsersError, type TraccarApiUsers } from '../../services/traccar-users.js';
import type { UserTraccar } from '../../types/index.js';

export class UsersController {
    constructor(private readonly traccarApiUsers: TraccarApiUsers) { }

    private handleError = (res: Response, error: unknown) => res.status(
        error instanceof TraccarUsersError ? error.status : 500,
    ).json({ error: error instanceof TraccarUsersError ? error.message : 'Error al gestionar el usuario' });

    create = async (req: Request, res: Response) => {
        try {
            return res.status(200).json(await this.traccarApiUsers.create(
                req.validated!.body as unknown as UserTraccar, req.sessionCookie!,
            ));
        } catch (error) { return this.handleError(res, error); }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const filters = new URLSearchParams();
            for (const [key, value] of Object.entries(req.validated!.query)) filters.set(key, String(value));
            return res.status(200).json(await this.traccarApiUsers.getAll(req.sessionCookie!, filters));
        } catch (error) { return this.handleError(res, error); }
    };

    getById = async (req: Request, res: Response) => {
        try {
            return res.status(200).json(await this.traccarApiUsers.getById(
                Number(req.validated!.params.id), req.sessionCookie!,
            ));
        } catch (error) { return this.handleError(res, error); }
    };

    update = async (req: Request, res: Response) => {
        try {
            return res.status(200).json(await this.traccarApiUsers.update(
                Number(req.validated!.params.id), req.validated!.body as unknown as UserTraccar, req.sessionCookie!,
            ));
        } catch (error) { return this.handleError(res, error); }
    };

    delete = async (req: Request, res: Response) => {
        try {
            await this.traccarApiUsers.delete(Number(req.validated!.params.id), req.sessionCookie!);
            return res.status(204).send();
        } catch (error) { return this.handleError(res, error); }
    };
}
