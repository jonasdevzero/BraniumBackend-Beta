import { ServerReply, ServerRequest } from '../../interfaces/controller';

export default {
    async index(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async add(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async role(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async remove(req: ServerRequest, reply: ServerReply) {
        try {
            // ...
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },
};
