import { FastifyPluginAsync } from 'fastify';
import { Server, ServerOptions } from 'socket.io';

declare module 'fastify' {
    interface FastifyInstance {
        ws: Server;
    }
    interface FastifyReply {
        ws: Server;
    }
}
