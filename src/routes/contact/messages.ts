import { FastifyPluginOptions, FastifyInstance } from "fastify"
import cMessagesController from "../../controllers/contact/messages"

export default function contactMessagesRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.get("/:contact", {
        schema: {}
    }, cMessagesController.index)

    done()
}
