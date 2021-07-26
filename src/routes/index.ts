import { FastifyPluginOptions, FastifyReply, FastifyInstance } from "fastify"
import fastifyJwt from "fastify-jwt"
import socket from "../socket"

const secret = process.env.USER_SECRET || "z"
const errorJwtMessages = {
    badRequestErrorMessage: "Format is Authorization: Bearer [token]",
    noAuthorizationInHeaderMessage: "Autorization header is missing!",
    authorizationTokenExpiredMessage: "Authorization token expired",
}

export default function routes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.register(fastifyJwt, {
        secret,
        messages: errorJwtMessages,
    })

    fastify.get("/", (req, reply: FastifyReply) => {
        socket.emit("message", "New access in [/] page", () => {})

        reply.status(200).send({ message: "ok" })
    })

    done()
}
