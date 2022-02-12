import { Server } from 'socket.io';

declare global {
    namespace globalThis {
        var ws: server;
    }
}
