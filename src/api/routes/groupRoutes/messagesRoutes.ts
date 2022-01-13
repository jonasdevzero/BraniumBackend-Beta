import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import MessagesController from '../../controllers/GroupController/MessagesController';
import schema from '../_schema/groupSchema/messagesSchema';

export default function messagesRoutes(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.get(
        '/:group_id',
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
        '/view',
        {
            schema: schema.view,
        },
        MessagesController.view,
    );

    fastify.post(
        '/:id/delete',
        {
            schema: schema.deleteMessage,
        },
        MessagesController.delete,
    );

    done();
}
