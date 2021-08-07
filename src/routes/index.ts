import { FastifyPluginOptions, FastifyReply, FastifyInstance } from "fastify"
import fastifyJwt from "fastify-jwt"
import userRoutes from "./user"
import contactRoutes from "./contact"

const secret = process.env.USER_SECRET || "zero"
const errorJwtMessages = {
    badRequestErrorMessage: "Format is Authorization: Bearer [token]",
    noAuthorizationInHeaderMessage: "Autorization header is missing!",
    authorizationTokenExpiredMessage: "Authorization token expired",
}

export default function routes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.register(fastifyJwt, { secret, messages: errorJwtMessages })

    fastify.addHook("onError", (_req, _reply, error, done) => {
        fastify.log.error(error)
        done()
    })

    fastify.get("/", (req, reply: FastifyReply) => { reply.status(200).send({ message: "ok" }) })
    fastify.get('/uploads/:filename', (req: any, reply) => { reply.sendFile(req.params.filename) })

    fastify.register(userRoutes, { prefix: "/user" })
    fastify.register(contactRoutes, { prefix: "/contact" })

    done()
}
