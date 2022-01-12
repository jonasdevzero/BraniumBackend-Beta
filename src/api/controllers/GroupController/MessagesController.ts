import { ServerReply, ServerRequest } from "../../interfaces/controller"

export default {
    async index(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error })
        }
    },
    
    async create(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error })
        }
    },

    async view(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error })
        }
    },

    async delete(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error })
        }
    },
}