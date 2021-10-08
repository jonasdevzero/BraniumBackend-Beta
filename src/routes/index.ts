import { FastifyPluginOptions, FastifyReply, FastifyInstance } from "fastify"
import userRoutes from "./user"
import contactRoutes from "./contact"
import testController from "../controllers/test"

export default function routes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.addHook("onError", (_req, _reply, error, done) => {
        fastify.log.error(error)
        done()
    })

    fastify.get("/", (req, reply: FastifyReply) => { reply.status(200).send({ message: "ok" }) })
    fastify.get('/uploads/:filename', (req: any, reply) => { reply.sendFile(req.params.filename) })

    fastify.register(userRoutes, { prefix: "/user" })
    fastify.register(contactRoutes, { prefix: "/contact" })

    fastify.get("/test/email", testController.sendMail)

    done()
}
