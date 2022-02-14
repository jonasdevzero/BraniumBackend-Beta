import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import userRoutes from './userRoutes';
import contactRoutes from './contactRoutes';
import groupRoutes from './groupRoutes';

export default function routes(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.get('/', (_req, reply) => {
        reply.status(200).send({ message: 'ok' });
    });
    fastify.get('/uploads/:filename', (req: any, reply) => {
        reply.raw.setHeader('Content-Disposition', 'attachment');
        reply.sendFile(req.params.filename);
    });

    fastify.register(userRoutes, { prefix: '/user' });
    fastify.register(contactRoutes, { prefix: '/contact' });
    fastify.register(groupRoutes, { prefix: '/group' });

    done();
}
