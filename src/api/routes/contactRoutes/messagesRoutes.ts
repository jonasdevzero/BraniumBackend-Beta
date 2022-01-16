import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import MessagesController from '../../controllers/ContactController/MessagesController';
import schema from '../../schemas/contactSchema/messagesSchema';

export default function contactMessagesRoutes(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.get(
        '/:contact',
        {
            schema: schema.index,
        },
        MessagesController.index,
    );

    fastify.post(
        '/',
        {
            schema: schema.create,
        },
        MessagesController.create,
    );

    fastify.patch(
        '/view/:contact',
        {
            schema: schema.view,
        },
        MessagesController.view,
    );

    fastify.delete(
        '/:message',
        {
            schema: schema.deleteOne,
        },
        MessagesController.deleteOne,
    );

    fastify.delete(
        '/clear/:contact',
        {
            schema: schema.clear,
        },
        MessagesController.clear,
    );

    done();
}
