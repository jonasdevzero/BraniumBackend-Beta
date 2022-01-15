import { getRepository } from 'typeorm';
import { upload } from '../../helpers';
import { ServerReply, ServerRequest } from '../../interfaces/controller';
import {
    Group,
    GroupMediaMessage,
    GroupMessage,
    GroupMessageView,
    GroupUser,
} from '../../models';

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
            const { text, to, medias } = upload.parseBody(req.body);

            if (!text && !medias)
                return reply
                    .status(400)
                    .send({ message: 'Você deve ser enviar algum dado!' });

            const groupUserRepo = getRepository(GroupUser);
            const members = await groupUserRepo.find({
                where: {
                    group_id: to,
                },
                relations: ['user'],
            });

            const sender = members.find(m => m.user_id === sender_id);
            if (!sender)
                return reply
                    .status(401)
                    .send({ message: 'Você não está no grupo!' });

            const created_at = new Date();

            const [message] = await Promise.all([
                getRepository(GroupMessage)
                    .create({
                        group_id: to,
                        sender_id,
                        text,
                        created_at,
                    })
                    .save(),
                getRepository(Group).update(to, {
                    last_message_time: created_at,
                }),
                Promise.all(
                    members
                        .filter(m => m.user_id !== sender_id)
                        .map(m => {
                            const unread_messages =
                                (m.unread_messages || 0) + 1;
                            return groupUserRepo.update(m.id, {
                                unread_messages,
                            });
                        }),
                ),
            ]);
            const groupMessageViewRepo = getRepository(GroupMessageView);
            await Promise.all(
                members
                    .filter(m => m.user_id !== sender_id)
                    .map(m => {
                        return groupMessageViewRepo
                            .create({
                                message_id: message.id,
                                viewer_id: m.user_id,
                            })
                            .save();
                    }),
            );

            message.sender = sender.user;

            if (medias) {
                const mediaRepository = getRepository(GroupMediaMessage);
                const mediasArr = Array.isArray(medias) ? medias : [medias];

                const uploadedMedias = await Promise.all(
                    mediasArr.map(m => upload.save(m)),
                );
                const mediasSaved = await Promise.all(
                    uploadedMedias.map(m =>
                        mediaRepository
                            .create({
                                message_id: message.id,
                                url: m.Location,
                                type: m.type,
                            })
                            .save(),
                    ),
                );

                message.medias = mediasSaved;
            }

            reply.status(201).send({ message, to });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async view(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const group_id = req.params.group_id;

            const groupUserRepo = getRepository(GroupUser);
            const user = await groupUserRepo.findOne({
                where: { group_id, user_id: id },
            });

            if (!user)
                return reply
                    .status(404)
                    .send({ message: 'Você não está no grupo!' });

            const groupMessageViewRepo = getRepository(GroupMessageView);
            const unviewedMessages = await groupMessageViewRepo
                .createQueryBuilder('view')
                .leftJoinAndSelect('view.message', 'message')
                .where('view.viewer_id = :viewer_id', { viewer_id: id })
                .andWhere('view.viewed = :viewed', { viewed: false })
                .andWhere('message.group_id = :group_id', { group_id })
                .getMany();

            const viewed_at = new Date();
            await Promise.all([
                groupUserRepo.update(user.id, { unread_messages: undefined }),
                ...unviewedMessages.map(m =>
                    groupMessageViewRepo.update(m.id, {
                        viewed: true,
                        viewed_at,
                    }),
                ),
            ]);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async delete(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user;
            const message_id = req.params.id;

            const groupMessageRepo = getRepository(GroupMessage);
            const message = await groupMessageRepo.findOne(message_id, {
                relations: ['medias'],
            });

            if (!message)
                return reply
                    .status(404)
                    .send({ message: 'Mensagem não encontrada!' });

            if (message.sender_id !== id)
                return reply
                    .status(401)
                    .send({ message: 'Você não pode deletar esta mensagem!' });

            await Promise.all([
                groupMessageRepo.delete(message.id),
                ...message.medias.map(m => upload.remove(m.url)),
            ]);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },
};
