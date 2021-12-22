import { FastifyPluginOptions, FastifyInstance } from "fastify"
import authHook from "../../hooks/authHook"
import contactController from "../../controllers/contactController"
import contactSchema from "../_schema/contactSchema"
import contactSerializer from "../_preSerializer/contactSerializer"
import messagesRoutes from "./messagesRoutes"

export default function contactRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.addHook("preValidation", authHook)

    fastify.get('/:id', {
        schema: contactSchema.show,
        preSerialization: contactSerializer
    }, contactController.show)

    fastify.post('/invite/:id', {
        schema: contactSchema.invite
    }, contactController.invite)

    fastify.post('/invite/accept/:invite', {
        schema: contactSchema.acceptInvite,
        preSerialization: contactSerializer
    }, contactController.acceptInvite)

    fastify.post('/invite/refuse/:invite', {
        schema: contactSchema.refuseInvite
    },  contactController.refuseInvite)

    fastify.patch('/block/:id', {
        schema: contactSchema.block
    }, contactController.block)

    fastify.register(messagesRoutes, { prefix: "/messages" })

    done()
}
