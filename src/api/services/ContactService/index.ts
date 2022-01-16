import { getRepository } from 'typeorm';
import { Contact, ContactInvitation, User } from '../../models';

export default {
    /**
     * @param id The ID of whoever is inviting
     * @param contact_id The ID ofthe person being invited
     */
    inviteUser(id: string, contact_id: string): Promise<ContactInvitation> {
        return new Promise(async (resolve, reject) => {
            try {
                if (id == contact_id)
                    return reject({
                        status: 400,
                        message: 'Você não pode convidar a si mesmo!',
                    });

                const userRepository = getRepository(User);
                const invitationRepository = getRepository(ContactInvitation);

                const [
                    user,
                    existsUser, // who is receiving the invite
                    invitationAlreadySent,
                    invitationAlreadyReceived,
                ] = await Promise.all([
                    userRepository.findOne({
                        where: { id },
                        relations: ['contacts'],
                    }),
                    userRepository.findOne({
                        where: { id: contact_id },
                        select: ['id'],
                    }),
                    invitationRepository.findOne({
                        where: {
                            sender_id: id,
                            receiver_id: contact_id,
                            pending: true,
                        },
                    }),
                    invitationRepository.findOne({
                        where: {
                            sender_id: contact_id,
                            receiver_id: id,
                            pending: true,
                        },
                    }),
                ]);

                if (!user)
                    return reject({
                        status: 404,
                        message: 'Sua conta não foi encontrada!',
                    });

                if (!existsUser)
                    return reject({
                        status: 400,
                        message: 'Usuário não encontrado!',
                    });

                if (user.contacts.find(c => c.contact_user_id === contact_id))
                    return reject({
                        status: 400,
                        message: 'Você já possui este contato',
                    });

                if (invitationAlreadySent)
                    return reject({
                        status: 400,
                        message: 'Você já enviou um convite para este usuário',
                    });

                if (invitationAlreadyReceived)
                    return reject({
                        status: 400,
                        message: 'Este usuário já lhe enviou um convite!',
                    });

                const invite = await invitationRepository
                    .create({ sender: user, receiver_id: contact_id })
                    .save();

                resolve(invite);
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
     * Accept the invite from a user
     * @param id - The ID of who is accepting the invite
     * @param invitation_id - The ID of the invite
     * @returns Returns a `Promise<[Contact, Contact]>`
     *  * [0] The `Contact` of who sent the invite
     *  * [1] The `Contact` of who accept the invite
     */
    acceptInvite(
        id: string,
        invitation_id: string,
    ): Promise<[Contact, Contact]> {
        return new Promise(async (resolve, reject) => {
            try {
                const contactRepository = getRepository(Contact);
                const invitationsRepository = getRepository(ContactInvitation);

                const invitation = await invitationsRepository.findOne(
                    invitation_id,
                    { relations: ['user', 'sender'] },
                );

                if (!invitation)
                    return reject({
                        status: 404,
                        message: 'Convite não encontrado!',
                    });

                const {
                    sender_id,
                    receiver_id,
                    pending,
                    sender,
                    user: receiver,
                } = invitation;

                if (receiver_id !== id)
                    return reject({
                        status: 401,
                        message: 'Este convite é para outro usuário!',
                    });

                if (!pending)
                    return reject({
                        status: 400,
                        message: 'Convite inválido!',
                    });

                const [contact, selfContact] = await Promise.all([
                    contactRepository
                        .create({
                            user_id: id,
                            contact_user_id: sender_id,
                            contact: sender,
                        })
                        .save(),
                    contactRepository
                        .create({
                            user_id: sender_id,
                            contact_user_id: id,
                            contact: receiver,
                        })
                        .save(),
                    invitationsRepository.update(invitation, {
                        pending: false,
                    }),
                ]);

                resolve([contact, selfContact]);
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
     * Refuse the invite from a user
     * @param id - The ID of who is accepting the invite
     * @param invitation_id - The ID of the invite
     * @returns Returns the invitation that was refused
     */
    refuseInvite(
        id: string,
        invitation_id: string,
    ): Promise<ContactInvitation> {
        return new Promise(async (resolve, reject) => {
            try {
                const invitationsRepository = getRepository(ContactInvitation);
                const invitation = await invitationsRepository.findOne({
                    where: { id: invitation_id, receiver_id: id },
                    relations: ['user'],
                });

                if (!invitation)
                    return reject({
                        status: 404,
                        message: 'Convite não encontrado!',
                    });

                const { receiver_id, pending } = invitation;

                if (receiver_id !== id)
                    return reject({
                        status: 400,
                        message: 'Este convite é para outro usuário!',
                    });

                if (!pending)
                    return reject({
                        status: 400,
                        message: 'Convite inválido!',
                    });

                await invitationsRepository.update(invitation, {
                    pending: false,
                });

                resolve(invitation);
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
     * Block and unblock a contact
     * @param id
     * @param contact_id
     * @returns Returns a `Promise<[Contact, Contact]>`
     *  * [0] Is my contact that I have with the other user
     *  * [1] Is the contact that the other user has with me.
     */
    toggleBlock(id: string, contact_id: string): Promise<[Contact, Contact]> {
        return new Promise(async (resolve, reject) => {
            try {
                const contactRepository = getRepository(Contact);

                const [contact, selfContact] = await Promise.all([
                    contactRepository.findOne({
                        where: { user_id: id, contact_user_id: contact_id },
                        relations: ['user'],
                    }),
                    contactRepository.findOne({
                        user_id: contact_id,
                        contact_user_id: id,
                    }),
                ]);

                if (!contact || !selfContact)
                    return reject({
                        status: 404,
                        message: 'Contato não encontrado!',
                    });

                await Promise.all([
                    contactRepository.update(contact, {
                        you_blocked: !contact.you_blocked,
                    }),
                    contactRepository.update(selfContact, {
                        blocked: !selfContact.blocked,
                    }),
                ]);

                resolve([contact, selfContact]);
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
