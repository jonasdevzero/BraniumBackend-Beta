import { getRepository } from 'typeorm';
import { ServerReply, ServerRequest } from '../../interfaces/controller';
import GroupMessagesService from '../../services/GroupService/MessagesService';
import { GroupMessage, GroupUser } from '../../models';

export default {
    async index(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const group_id = req.params.group_id;
            let { limit, skip, skip_u } = req.query;

            limit = limit > 0 ? limit : 30;
            skip = (skip > 0 ? skip : 0) * limit + (skip_u || 0);

            const member = await getRepository(GroupUser).findOne({
                group_id,
                user_id: id,
            });

            if (!member)
                return reply
                    .status(401)
                    .send({ message: 'Você não está no grupo!' });

            const messages = await getRepository(GroupMessage).find({
                where: { group_id },
                take: limit,
                skip,
                order: { created_at: 'DESC' },
                relations: ['medias', 'sender'],
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

            const sender_id = req.user as string;
            const { text, to, medias } = req.body;

            const message = await GroupMessagesService.createMessage({
                sender_id,
                to,
                text,
                medias,
            });

            reply.status(201).send({ message, to });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async view(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const group_id = req.params.group_id;

            await GroupMessagesService.viewMessages(id, group_id);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async delete(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const message_id = req.params.id;

            await GroupMessagesService.deleteOneMessage(id, message_id);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },
};
