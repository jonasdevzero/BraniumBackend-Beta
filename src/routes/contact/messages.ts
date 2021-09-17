import { FastifyPluginOptions, FastifyInstance } from "fastify"
import cMessagesController from "../../controllers/contact/messages"
import schema from "../_schema/contactSchema/messages"

export default function contactMessagesRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.get("/:contact", {
        schema: schema.index
    }, cMessagesController.index)

    fastify.post("/", {
        schema: {}
    }, cMessagesController.create)

    fastify.patch("/view/:contact", {
        schema: {}
    }, cMessagesController.view)

    fastify.delete("/:message", {
        schema: {}
    }, cMessagesController.deleteOne)

    fastify.delete("/clear/:contact", {
        schema: {}
    }, cMessagesController.clear)

    done()
}
