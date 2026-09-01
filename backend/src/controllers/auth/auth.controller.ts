import type { Request, response, Response } from "express"
import { TraccarApiSession } from "../../services/traccar-session.js"




export class AuthController {
    constructor(private readonly traccarApiSession: TraccarApiSession) { }

    login = (req: Request, res: Response) => {
        const { email, password } = req.validated!.body as { email: string; password: string };
        this.traccarApiSession.session({ email, password })
            .then(data => {
                if (data.cookie) {
                    res.header('set-cookie', data.cookie!)
                }
                return res.status(200).json(data)
            })
            .catch(error => {
                return res.status(401).json({
                    error: error.message || 'Error de autenticación'
                });
            });
    }

    getUser = (req: Request, res: Response) => {

        if (!req.sessionCookie) {
            return res.status(401).json({
                message: 'No autorizado'
            })
        }
        this.traccarApiSession.getUser(req.sessionCookie).then(data => {
            return res.status(200).json(data)
        }).catch(error => {
            return res.status(401).json({
                error: error.message || 'Error al obtener la sesion'
            });

        });
    }

    logout = (req: Request, res: Response) => {
        if (!req.sessionCookie) {
            return res.status(401).json({
                message: 'No autorizado'
            })
        }
        this.traccarApiSession.logout(req.sessionCookie).then((data) => {
            res.clearCookie('JSESSIONID')
            return res.status(200).json(data)
        }).catch(error => {
            return res.status(401).json({
                error: error.message || 'Error al cerrar sesion'
            });

        });
    }
}
