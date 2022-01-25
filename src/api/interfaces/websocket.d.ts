import { Server } from 'socket.io';

declare module 'fastify' {
    interface FastifyInstance {
        ws: Server;
    }
}
