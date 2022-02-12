import fp from 'fastify-plugin';
import { Server, ServerOptions } from 'socket.io';

const websocketPlugin = fp(async function (
    fastify,
    opts?: Partial<ServerOptions>,
) {
    const server = new Server(fastify.server, opts);
    globalThis.ws = server;

    fastify.decorate('ws', server);

    fastify.addHook('onClose', (fastify, done) => {
        fastify.ws.close();
        done();
    });
});

export default websocketPlugin;
