import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import UsersController from '../../controllers/GroupController/UsersController';
import { serializeGroupUsers } from '../../views/GroupUserView';
import schema from '../../schemas/groupSchema/usersSchema';

export default function usersRoutes(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.get(
        '/:group_id',
        {
            schema: schema.index,
            preSerialization: serializeGroupUsers("users")
        },
        UsersController.index,
    );

    fastify.post(
        '/',
        {
            schema: schema.add,
            preSerialization: serializeGroupUsers("member")
        },
        UsersController.add,
    );

    fastify.patch(
        '/role',
        {
            schema: schema.role,
        },
        UsersController.role,
    );

    fastify.post(
        '/remove',
        {
            schema: schema.remove,
        },
        UsersController.remove,
    );

    done();
}
