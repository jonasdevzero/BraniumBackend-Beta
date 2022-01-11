import fp from 'fastify-plugin';
import { Server, ServerOptions } from 'socket.io';

const websocketPlugin = fp(async function (
    fastify,
    opts?: Partial<ServerOptions>,
) {
    const ws = new Server(fastify.server, opts);

    fastify.decorate('ws', ws);
    fastify.addHook('onRequest', (_req, reply, done) => {
        reply.ws = ws;

        done();
    });

    fastify.addHook('onClose', (fastify, done) => {
        fastify.ws.close();
        done();
    });
});

export default websocketPlugin;
