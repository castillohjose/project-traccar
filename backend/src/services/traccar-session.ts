import type { response } from "express";
import { envs } from "../config/envs.js";
import type { SessionTraccar } from "../types/index.js";

export class TraccarApiSession {

    private url: string = `${envs.TRACAR_API_URL}/session`;

    session = async ({ email, password }: SessionTraccar) => {
        return fetch(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ email, password }),


        })
            .then(async response => {
                if (response.ok) {
                    const cookie = response.headers.get('set-cookie');

                    return {
                        message: 'Session iniciada correctamente',
                        cookie,
                    }
                }
                return response.text().then(textError => {
                    throw new Error(textError || 'Credenciales incorrectas o error en Traccar');
                });

            })
            .then(data => {

                return data;
            })
            .catch(error => {
                console.error('Error en TraccarApi:', error.message);
                throw error;
            });
    }

    getUser = async (cookie: string) => {
        return fetch(`${this.url}`, {
            method: 'GET',
            headers: {
                'Cookie': `JSESSIONID=${cookie}`
            }
        })
            .then(async response => {
                if (response.ok) {
                    return response.json();
                }
                const textError = await response.text();
                throw new Error(textError || 'Error al obtener la sesion');
            })
            .then(data => {
                return data
            })
            .catch(error => {
                console.error('Error en TraccarApi:', error.message);
                throw error;
            });
    }


    logout = async (cookie: string) => {

        return fetch(`${this.url}`, {
            method: 'DELETE',
            headers: {
                'Cookie': `JSESSIONID=${cookie}`
            }
        })
            .then(async response => {
                if (response.ok) {
                    return { message: 'Sesion cerrada correctamente' };
                }
                const textError = await response.text();
                throw new Error(textError || 'Error al cerrar sesion');
            })
            .catch(error => {
                console.error('Error en TraccarApi:', error.message);
                throw error;
            });


    }

}

