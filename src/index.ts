import "dotenv"
import "./database"
import fastify from "fastify"
import fastifyCors from "fastify-cors"
import fastifyJwt from "fastify-jwt"
import fastifyMultipart from "fastify-multipart"
import fastifyStatic from "fastify-static"
import cluster from "cluster"
import { cpus } from "os"
import path from "path"
import routes from "./routes"
import { socketServer } from "./socket"

const port = process.env.PORT || 5000
const host = "0.0.0.0"
const secret = process.env.USER_SECRET || "zero"
const errorJwtMessages = {
    badRequestErrorMessage: "Sessão inválida!",
    noAuthorizationInHeaderMessage: "Sessão não encontrada!",
    authorizationTokenExpiredMessage: "Sessão expirada!",
}

if (cluster.isPrimary) {
    for (let i = 0; i < cpus().length; i++) {
        cluster.fork()
    }

    cluster.on("exit", worker => {
        console.log(`Process ${worker.process.pid} died`)
        cluster.fork()
    })
} else {
    const server = fastify({ logger: true })
    
    server.register(fastifyCors, { origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "PATCH"] })
    server.register(fastifyJwt, { secret, messages: errorJwtMessages })
    server.register(fastifyStatic, { root: path.join(__dirname, "..", "uploads") })
    server.register(fastifyMultipart, { attachFieldsToBody: true })
    server.register(routes)

    server.listen(port, host, async (err, address) => {
        if (err) {
            server.log.error(err)
            process.exit(1)
        }

        socketServer(server)
        server.log.info(`server listening on ${address}`)
    })
}