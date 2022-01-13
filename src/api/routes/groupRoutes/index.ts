import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import authHook from '../../hooks/auth';
import GroupController from '../../controllers/GroupController';
import schema from '../_schema/groupSchema';
import usersRoutes from './usersRoutes';
import messagesRoutes from './messagesRoutes';

export default function groupRoutes(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.addHook('preValidation', authHook);

    fastify.get(
        '/:id',
        {
            schema: schema.show,
        },
        GroupController.show,
    );

    fastify.post(
        '/',
        {
            schema: schema.create,
        },
        GroupController.create,
    );

    fastify.put(
        '/:id',
        {
            schema: schema.update,
        },
        GroupController.update,
    );

    fastify.patch(
        '/:id/picture',
        {
            schema: schema.update_picture,
        },
        GroupController.update_picture,
    );

    fastify.post(
        '/:id/leave',
        {
            schema: schema.leave,
        },
        GroupController.leave,
    );

    fastify.delete(
        '/:id',
        {
            schema: schema.deleteGroup,
        },
        GroupController.delete,
    );

    fastify.register(usersRoutes, { prefix: '/users' });
    fastify.register(messagesRoutes, { prefix: '/messages' });

    done();
}
