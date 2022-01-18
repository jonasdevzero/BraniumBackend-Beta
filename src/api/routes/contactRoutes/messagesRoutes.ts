import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import MessagesController from '../../controllers/ContactController/MessagesController';
import schema from '../../schemas/contactSchema/messagesSchema';
import { validatorCompiler, errorHandler } from '../../middlewares';

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
            validatorCompiler,
            errorHandler,
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
            validatorCompiler,
            errorHandler,
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
