import 'cors';
import './api/database';
import App from './app';
import { socketConnection } from './api/websocket/connection';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = App({ logger: true });

server.ready(err => {
    if (err) throw err;

    server.ws.on('connection', socket => socketConnection(socket, server));
});

server.listen(PORT, HOST, async (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }

    server.log.info(`server listening on ${address}`);
});
