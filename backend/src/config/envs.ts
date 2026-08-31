import 'dotenv/config';
import env from 'env-var';


export const envs = {

    PORT: env.get('PORT').required().asPortNumber(),
    TRACAR_API_URL: env.get('TRACCAR_API_URL').required().asString(),

}