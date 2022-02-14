import 'cors';
import './api/database';
import cluster from 'cluster';
import { cpus } from 'os';
import { setupMaster, setupWorker } from '@socket.io/sticky';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';
import App from './app';
import { socketConnection } from './api/websocket/connection';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';


if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);
    
    const server = App({ logger: true });
    
    setupMaster(server.server, {
        loadBalancingMethod: 'least-connection',
    });

    setupPrimary();

    for (let i = 0; i < cpus().length; i++) {
        cluster.fork();
    }

    cluster.on('exit', worker => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    const server = App({ logger: true });

    server.ready(err => {
        if (err) throw err;

        server.ws.adapter(createAdapter());

        setupWorker(server.ws);

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
