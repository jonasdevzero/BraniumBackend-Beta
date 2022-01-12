import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import authHook from '../../hooks/auth';
import UsersController from '../../controllers/GroupController/UsersController';

export default function usersRoutes(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.addHook('preValidation', authHook);

    fastify.get('/:group_id', {}, UsersController.index);

    fastify.post('/', {}, UsersController.add);

    fastify.patch('/role', {}, UsersController.role);

    fastify.post('/remove', {}, UsersController.remove);

    done();
}
