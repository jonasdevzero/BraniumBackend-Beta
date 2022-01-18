import { getRepository } from 'typeorm';
import { upload } from '../../helpers';
import {
    Group,
    GroupMediaMessage,
    GroupMessage,
    GroupMessageView,
    GroupUser,
} from '../../models';

interface CreateGroupMessageI {
    sender_id: string;
    to: string;
    text: string;
    medias: any;
}

export default {
    /**
     * Create a `GroupMessage`
     * @param data 
     * @returns Return a `GroupMessage`
     */
    createMessage(data: CreateGroupMessageI): Promise<GroupMessage> {
        return new Promise(async (resolve, reject) => {
            try {
                const { sender_id, to, text, medias } = data;

                if (!text && !medias)
                    return reject({
                        status: 400,
                        message: 'Você deve ser enviar algum dado!',
                    });

                const groupUserRepo = getRepository(GroupUser);
                const members = await groupUserRepo.find({
                    where: {
                        group_id: to,
                    },
                    relations: ['user'],
                });

                const sender = members.find(m => m.user_id === sender_id);
                if (!sender)
                    return reject({
                        status: 401,
                        message: 'Você não está no grupo!',
                    });

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

                resolve(message);
            } catch (error) {
                reject({
                    status: 500,
                    message: 'Internal Server Error',
                    error,
                });
            }
        });
    },

    /**
     * View all messages from a group
     * @param id The User ID who is viewing the mssages
     * @param group_id The Group ID
     */
    viewMessages(id: string, group_id: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const groupUserRepo = getRepository(GroupUser);
                const user = await groupUserRepo.findOne({
                    where: { group_id, user_id: id },
                });

                if (!user)
                    return reject({
                        status: 404,
                        message: 'Você não está no grupo!',
                    });

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
                    groupUserRepo.update(user.id, {
                        unread_messages: undefined,
                    }),
                    ...unviewedMessages.map(m =>
                        groupMessageViewRepo.update(m.id, {
                            viewed: true,
                            viewed_at,
                        }),
                    ),
                ]);

                resolve();
            } catch (error) {
                reject({
                    status: 500,
                    message: 'Internal Server Error',
                    error,
                });
            }
        });
    },

    /**
     * Delete one message message in a group
     * @param id The User ID who is deleting the mssage
     * @param message_id The Group Message ID
     */
    deleteOneMessage(id: string, message_id: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const groupMessageRepo = getRepository(GroupMessage);
                const message = await groupMessageRepo.findOne(message_id, {
                    relations: ['medias'],
                });

                if (!message)
                    return reject({
                        status: 404,
                        message: 'Mensagem não encontrada!',
                    });

                if (message.sender_id !== id)
                    return reject({
                        status: 401,
                        message: 'Você não pode deletar esta mensagem!',
                    });

                await Promise.all([
                    groupMessageRepo.delete(message.id),
                    ...message.medias.map(m => upload.remove(m.url)),
                ]);

                resolve();
            } catch (error) {
                reject({
                    status: 500,
                    message: 'Internal Server Error',
                    error,
                });
            }
        });
    },
};
