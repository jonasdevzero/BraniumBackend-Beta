import fp from 'fastify-plugin';
import { Server, ServerOptions } from 'socket.io';
import { setupWorker } from '@socket.io/sticky';
import { createAdapter } from "@socket.io/cluster-adapter";

const websocketPlugin = fp(async function (
    fastify,
    opts?: Partial<ServerOptions>,
) {
    const server = new Server(fastify.server, opts);

    server.adapter(createAdapter())
    setupWorker(server);

    globalThis.ws = server;

    fastify.decorate('ws', server);

    fastify.addHook('onClose', (fastify, done) => {
        fastify.ws.close();
        done();
    });
});

export default websocketPlugin;
