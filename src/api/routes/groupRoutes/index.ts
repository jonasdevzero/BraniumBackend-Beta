import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import authHook from '../../hooks/auth';
import GroupController from '../../controllers/GroupController';
import usersRoutes from './usersRoutes';
import messagesRoutes from './messagesRoutes';

export default function groupRoutes(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.addHook('preValidation', authHook);

    fastify.get('/:id', {}, GroupController.show);

    fastify.post('/', {}, GroupController.create);

    fastify.put('/:id', {}, GroupController.update);

    fastify.patch('/:id/picture', {}, GroupController.update_picture);

    fastify.post('/:id/leave', {}, GroupController.leave);

    fastify.delete('/:id', {}, GroupController.delete);

    fastify.register(usersRoutes, { prefix: '/users' })
    fastify.register(messagesRoutes, { prefix: '/messages' })

    done();
}
