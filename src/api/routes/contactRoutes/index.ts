import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import authHook from '../../middlewares/auth';
import ContactController from '../../controllers/ContactController';
import contactSchema from '../../schemas/contactSchema';
import serializeContact from '../../views/ContactView';
import messagesRoutes from './messagesRoutes';

export default function contactRoutes(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.addHook('preValidation', authHook);

    fastify.get(
        '/:id',
        {
            schema: contactSchema.show,
            preSerialization: serializeContact,
        },
        ContactController.show,
    );

    fastify.post(
        '/invite/:id',
        {
            schema: contactSchema.invite,
        },
        ContactController.invite,
    );

    fastify.post(
        '/invite/accept/:invite',
        {
            schema: contactSchema.acceptInvite,
            preSerialization: serializeContact,
        },
        ContactController.acceptInvite,
    );

    fastify.post(
        '/invite/refuse/:invite',
        {
            schema: contactSchema.refuseInvite,
        },
        ContactController.refuseInvite,
    );

    fastify.patch(
        '/block/:id',
        {
            schema: contactSchema.block,
        },
        ContactController.block,
    );

    fastify.register(messagesRoutes, { prefix: '/messages' });

    done();
}
