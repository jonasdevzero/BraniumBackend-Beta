import { ServerReply, ServerRequest } from '../../interfaces/controller';

export default {
    async show(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async create(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async update(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async update_picture(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async leave(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async delete(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },
};
