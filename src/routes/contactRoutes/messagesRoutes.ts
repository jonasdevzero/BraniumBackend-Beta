import { FastifyPluginOptions, FastifyInstance } from "fastify"
import cMessagesController from "../../controllers/contactController/messagesController"
import schema from "../_schema/contactSchema/messagesSchema"

export default function contactMessagesRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.get("/:contact", {
        schema: schema.index,
    }, cMessagesController.index)

    fastify.post("/", {
        schema: schema.create,
    }, cMessagesController.create)

    fastify.patch("/view/:contact", {
        schema: schema.view,
    }, cMessagesController.view)

    fastify.delete("/:message", {
        schema: schema.deleteOne,
    }, cMessagesController.deleteOne)

    fastify.delete("/clear/:contact", {
        schema: schema.clear,
    }, cMessagesController.clear)

    done()
}
