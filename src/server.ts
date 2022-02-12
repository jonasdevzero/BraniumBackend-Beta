import './api/database';
import cluster from 'cluster';
import { cpus } from 'os';
import { setupMaster } from "@socket.io/sticky"
import { setupPrimary } from "@socket.io/cluster-adapter"
import App from './app';
import { socketConnection } from './api/websocket/connection';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

if (cluster.isPrimary) {
    const server = App();

    setupMaster(server.server);

    setupPrimary()

    for (let i = 0; i < cpus().length; i++) {
        cluster.fork();
    }

    cluster.on('exit', worker => {
        console.log(`Process ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
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
}
