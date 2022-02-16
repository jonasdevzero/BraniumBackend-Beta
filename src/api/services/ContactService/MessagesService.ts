import { getRepository } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';
import { upload } from '../../helpers';
import { Contact, ContactMediaMessage, ContactMessage } from '../../models';

export default {
    /**
     * Creates a `ContactMessage`
     * @param sender_id The User ID who is sending the message
     * @returns Returns a `Promise<[ContactMessage, ContactMessage]>`
     *  * [0] The `ContactMessage` of who sent the message
     *  * [1] The `ContactMessage` of who is receiving the message
     */
    create(
        sender_id: string,
        { to, text, medias }: { to: string; text: string; medias: any },
    ): Promise<[ContactMessage, ContactMessage]> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!text && !medias)
                    return reject({
                        status: 400,
                        message: 'Você deve enviar algum dado!',
                    });

                const contactRepository = getRepository(Contact);
                const [sender, receiver] = await Promise.all([
                    contactRepository.findOne({
                        where: { user_id: sender_id, contact_user_id: to },
                    }),
                    contactRepository.findOne({
                        where: { user_id: to, contact_user_id: sender_id },
                    }),
                ]);

                if (!sender)
                    return reject({
                        status: 404,
                        message: 'Sua conta não foi encontrada!',
                    });

                if (!receiver)
                    return reject({
                        status: 404,
                        message: 'Contato não encontrado!',
                    });

                if (sender.blocked)
                    return reject({
                        status: 400,
                        message: 'Você foi bloqueado!',
                    });

                if (sender.you_blocked)
                    return reject({
                        status: 400,
                        message: 'Você bloqueou este contato!',
                    });

                const contactMessageRepo = getRepository(ContactMessage);
                const created_at = new Date();
                const unread_messages = receiver.unread_messages + 1;

                const messageData = {
                    text,
                    sender_id,
                    created_at,
                    bidirectional_id: uuidV4(),
                };
                const [message, selfMessage] = await Promise.all([
                    contactMessageRepo
                        .create({
                            ...messageData,
                            contact_id: sender.id,
                            viewed: true,
                        })
                        .save(),
                    contactMessageRepo
                        .create({
                            ...messageData,
                            contact_id: receiver.id,
                            viewed: false,
                        })
                        .save(),
                    contactRepository.update(sender.id, {
                        last_message_time: created_at,
                    }),
                    contactRepository.update(receiver.id, {
                        unread_messages,
                        last_message_time: created_at,
                    }),
                ]);

                if (medias && message && selfMessage) {
                    const mediaRepository = getRepository(ContactMediaMessage);

                    const uploadedMedias = await Promise.all(
                        (Array.isArray(medias) ? medias : [medias]).map(m =>
                            upload.save(m),
                        ),
                    );
                    const [mediasSaved, receiverMediasSaved] =
                        await Promise.all([
                            Promise.all(
                                uploadedMedias.map(m => {
                                    return mediaRepository
                                        .create({
                                            message_id: message.id,
                                            url: m.Location,
                                            type: m.type,
                                        })
                                        .save();
                                }),
                            ),
                            Promise.all(
                                uploadedMedias.map(m => {
                                    return mediaRepository
                                        .create({
                                            message_id: selfMessage.id,
                                            url: m.Location,
                                            type: m.type,
                                        })
                                        .save();
                                }),
                            ),
                        ]);

                    message.medias = mediasSaved;
                    selfMessage.medias = receiverMediasSaved;
                }

                resolve([message, selfMessage]);
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
     * View all messages from a contact
     * @param id The User ID that is viewing the messages
     * @param contact_id The user ID of the contact who is having the messages viewed
     * @returns Returns the date that be viewed
     */
    viewMessages(id: string, contact_id: string): Promise<Date> {
        return new Promise(async (resolve, reject) => {
            try {
                const contactRepository = getRepository(Contact);
                const [contact, selfContact] = await Promise.all([
                    contactRepository.findOne({
                        where: { user_id: id, contact_user_id: contact_id },
                    }),
                    contactRepository.findOne({
                        where: { user_id: contact_id, contact_user_id: id },
                    }),
                ]);

                if (!selfContact || !contact)
                    return reject({
                        status: 404,
                        message: 'Contato não encontrado!',
                    });

                const contactMessageRepo = getRepository(ContactMessage);
                const [unviewedMessages, selfUnviewedMessages] =
                    await Promise.all([
                        contactMessageRepo.find({
                            where: {
                                contact_id: contact.id, // The ID of the table `contact`
                                viewed: false,
                                sender_id: contact_id,
                            },
                        }),
                        contactMessageRepo.find({
                            contact_id: selfContact.id,
                            viewed: false,
                            sender_id: contact_id,
                        }),
                    ]);

                const viewed_at = new Date();
                const viewMessages = (m: ContactMessage) =>
                    contactMessageRepo.update(m.id, {
                        viewed: true,
                        viewed_at,
                    });

                await Promise.all([
                    contactRepository.update(contact, { unread_messages: 0 }),
                    Promise.all([
                        ...unviewedMessages.map(viewMessages),
                        ...selfUnviewedMessages.map(viewMessages),
                    ]),
                ]);

                resolve(viewed_at);
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
     * Delete a message
     * @param id The User ID that is deleting the message
     * @param message_id The ID of the message that will be deleted
     * @param target The way the message is being deleted
     *  * `me` - delete the message only for a `Contact`
     *  * `bidirectional` - delete message for both `Contact`
     * @returns Returns the User ID of the contact that the message was deleted
     */
    deleteOne(
        id: string,
        message_id: string,
        target: 'me' | 'bidirectional',
    ): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const field = target === 'me' ? 'id' : 'bidirectional_id';
                const contactMessageRepo = getRepository(ContactMessage);
                const message = await contactMessageRepo
                    .createQueryBuilder('c_message')
                    .leftJoinAndSelect('c_message.contact', 'c_message_contact')
                    .where(
                        `c_message.${field} = :message_id AND c_message_contact.user_id = :user_id`,
                        { message_id, user_id: id },
                    )
                    .getOne();

                if (!message)
                    return reject({
                        status: 404,
                        message: 'Mensagem não encontrada!',
                    });

                if (message.contact.user_id !== id)
                    return reject({
                        status: 401,
                        message: 'Você não enviou esta mensagem!',
                    });

                target = target || 'me';
                switch (target) {
                    case 'me':
                        await contactMessageRepo.delete({ id: message_id });
                        break;
                    case 'bidirectional':
                        if (message.sender_id !== id)
                            return reject({
                                status: 401,
                                message: 'Você não enviou esta mensagem!',
                            });

                        await contactMessageRepo.delete({
                            bidirectional_id: message.bidirectional_id,
                        });
                        break;
                }

                resolve(message.contact.contact_user_id);
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
     * Clear all messages only for a `Contact`
     * @param id The User ID that is clearing the messages
     * @param contact_id The user ID of the contact
     */
    clear(id: string, contact_id: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const contact = await getRepository(Contact).findOne({
                    where: { user_id: id, contact_user_id: contact_id },
                });

                if (!contact)
                    return reject({
                        status: 404,
                        message: 'Contato não encontrado!',
                    });

                // Deleting all messages from a `Contact`
                await getRepository(ContactMessage).delete({ contact });

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
