import { getRepository } from 'typeorm';
import { ServerRequest, ServerReply } from '../../interfaces/controller';
import { Contact, ContactMessage } from '../../models';
import ContactMessagesService from '../../services/ContactService/MessagesService';
import WebSocketService from '../../services/WebSocketService';

export default {
    async index(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user;
            const contact_id = req.params.contact;
            let { limit, skip, skip_u } = req.query;

            limit = limit > 0 ? limit : 30;
            skip = (skip > 0 ? skip : 0) * limit + (skip_u || 0);

            const contactRepository = getRepository(Contact);
            const cMessageRepository = getRepository(ContactMessage);

            const contact = await contactRepository.findOne({
                where: { user_id: id, contact_user_id: contact_id },
                select: ['id'],
            });

            if (!contact)
                return reply
                    .status(404)
                    .send({ message: 'Contato não encontrado!' });

            const messages = await cMessageRepository.find({
                where: { contact_id: contact.id },
                take: limit,
                skip,
                order: { created_at: 'DESC' },
                relations: ['medias'],
            });

            reply.status(200).send({ messages });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async create(req: ServerRequest, reply: ServerReply) {
        try {
            if (!req.isMultipart())
                return reply
                    .status(400)
                    .send({ message: 'Envie os dados no formato Multipart!' });

            const sender_id = req.user.toString();
            const { text, to, medias } = req.body;

            const [message, messageOfReceiver] =
                await ContactMessagesService.create(sender_id, {
                    to,
                    text,
                    medias,
                });

            WebSocketService.contact.messages.create(
                message,
                messageOfReceiver,
                to,
            );
            reply.status(201).send({ message, to });
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },

    async view(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const contact_id = req.params.contact;

            const viewed_at = await ContactMessagesService.viewMessages(
                id,
                contact_id,
            );
            WebSocketService.contact.messages.view(contact_id, id, viewed_at);

            reply.status(200).send({ message: 'ok' });
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },

    async deleteOne(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const message_id = req.params.message;
            let { target } = req.query;

            const contact_id = await ContactMessagesService.deleteOne(
                id,
                message_id,
                target,
            );
            target === 'bidirectional'
                ? WebSocketService.contact.messages.deleteOne(
                      contact_id,
                      id,
                      message_id,
                  )
                : null;

            reply.status(200).send({ message: 'ok' });
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },

    async clear(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const contact_id = req.params.contact;

            await ContactMessagesService.clear(id, contact_id);

            reply.status(200).send({ message: 'ok' });
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },
};
