import 'dotenv';
import fastify from 'fastify';
import fastifyCors from 'fastify-cors';
import fastifyJwt from 'fastify-jwt';
import fastifyMultipart from 'fastify-multipart';
import fastifyStatic from 'fastify-static';
import path from 'path';
import routes from './api/routes/root';
import websocketPlugin from './api/plugins/websocket';
import { socketConnection } from './api/websocket/connection';
import { constants } from './config/constants';

const SECRET = process.env.USER_SECRET || 'zero';

function build(opts = {}) {
    const app = fastify(opts);

    app.register(fastifyCors, {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    });

    app.register(fastifyJwt, {
        secret: SECRET,
        messages: constants.errorJwtMessages,
    });

    app.register(fastifyStatic, {
        root: path.join(__dirname, '..', 'uploads'),
    });

    app.register(fastifyMultipart, { attachFieldsToBody: true });

    app.register(websocketPlugin, {
        cors: {
            origin: '*',
        },
    });

    app.register(routes);

    app.ready(err => {
        if (err) throw err;

        app.ws.on('connection', socket => socketConnection(socket, app));
    });

    return app;
}

export default build;
