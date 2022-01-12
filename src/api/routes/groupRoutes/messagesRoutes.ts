import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import authHook from '../../hooks/auth';
import MessagesController from '../../controllers/GroupController/MessagesController';

export default function messagesRoutes(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.addHook('preValidation', authHook);

    fastify.get('/:group_id', {}, MessagesController.index);

    fastify.post('/', {}, MessagesController.create);

    fastify.patch('/view', {}, MessagesController.view);

    fastify.post('/:id/delete', {}, MessagesController.delete);

    done();
}
