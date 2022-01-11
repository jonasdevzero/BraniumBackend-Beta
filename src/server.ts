import './api/database';
import cluster from 'cluster';
import { cpus } from 'os';
import App from './app';
import { socketServer } from './api/websocket';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

if (cluster.isPrimary) {
    for (let i = 0; i < cpus().length; i++) {
        cluster.fork();
    }

    cluster.on('exit', worker => {
        console.log(`Process ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    const server = App({ logger: true });

    server.listen(PORT, HOST, async (err, address) => {
        if (err) {
            server.log.error(err);
            process.exit(1);
        }

        socketServer(server);
        server.log.info(`server listening on ${address}`);
    });
}
