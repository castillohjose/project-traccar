import express from 'express'
import { envs } from './config/envs.js'
import { AppRoutes } from './routes/index.js'
import cookieParser from 'cookie-parser'
const app = express()


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


app.use('/api', AppRoutes.routes)


app.listen(envs.PORT, function () {
    console.log("Servidor express activo")
})




