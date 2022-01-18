import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import authHook from '../../middlewares/auth';
import GroupController from '../../controllers/GroupController';
import schema from '../../schemas/groupSchema';
import serializeGroup from '../../views/GroupView';
import { validatorCompiler, errorHandler } from '../../middlewares';
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
            preSerialization: serializeGroup,
        },
        GroupController.show,
    );

    fastify.post(
        '/',
        {
            schema: schema.create,
            preSerialization: serializeGroup,
            validatorCompiler,
            errorHandler,
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
