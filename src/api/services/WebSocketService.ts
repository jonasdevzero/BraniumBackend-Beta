import {
    Contact,
    ContactInvitation,
    ContactMessage,
    Group,
    GroupMessage,
    GroupUser,
} from '../models';
import { wsUsers } from '../websocket/connection';
import { constants } from '../../config/constants';
import { renderContact } from '../views/ContactView';

const {
    socketActions,
    client: { actions: clientActions },
} = constants;

/**
 * WebSocket Emit Events Service
 */
export default {
    /**
     * Check if a user is online
     * @param id - User ID
     */
    isOnline(id: string) {
        return !!wsUsers.get(id);
    },

    /** User Events */
    user: {
        /**
         * Sends a WebSocket event to all contacts of `id`
         * @param id - The User ID who is sending the update to your contacts
         * @param data - The data that being updated
         */
        update(id: string, data: { name: string; username: string }) {
            const socket = wsUsers.get(id)?.socket;
            if (!socket) return;

            const contactsOnline = wsUsers.getContactsOnline(id);
            contactsOnline.forEach(c =>
                socket.to(c).emit(
                    'update',
                    socketActions.update(clientActions.UPDATE_ROOM, {
                        field: 'contacts',
                        where: { id },
                        set: data,
                    }),
                ),
            );
        },

        /**
         * Sends a WebSocket event to all contacts of `id`
         * @param id - The User ID who is sending the update to your contacts
         * @param picture - The picture `url`
         */
        update_picture(id: string, picture: string | undefined) {
            const socket = wsUsers.get(id)?.socket;
            if (!socket) return;

            const contactsOnline = wsUsers.getContactsOnline(id);
            contactsOnline.forEach(c =>
                socket.to(c).emit(
                    'update',
                    socketActions.update(clientActions.UPDATE_ROOM, {
                        field: 'contacts',
                        where: { id },
                        set: { picture },
                    }),
                ),
            );
        },

        delete(id: string) {},

        restore(id: string) {},
    },

    /** Contact Events */
    contact: {
        /**
         * Sends a WebSocket event to the receiver of the invite
         * @param invite - The invite that be send to the receiver of him
         */
        invite(invite: ContactInvitation) {
            const socket = wsUsers.get(invite.receiver_id)?.socket;
            if (!socket) return;

            socket.emit(
                'update',
                socketActions.update(clientActions.USER_PUSH_DATA, {
                    field: 'contact_invitations',
                    set: { data: invite },
                }),
            );
            socket.emit(
                'warn',
                socketActions.warn(
                    'info',
                    `${invite.sender.username} enviou um convite de amizade!`,
                ),
            );
        },

        /**
         * Sends a WebSocket event for the sender of invite
         * @param contacat - Is my contact that I have with the other user
         * @param selfContact - Is the contact that the other user has with me
         */
        acceptInvite(contacat: Contact, selfContact: Contact) {
            const socket = wsUsers.get(selfContact.user_id)?.socket;
            if (!socket) return;

            // Pushing new contacts for futures updates with them. ex: emit logout for contacts.
            wsUsers.pushContact(contacat.user_id, contacat);
            wsUsers.pushContact(selfContact.user_id, selfContact);

            // Client Side Pattern - TEMPORARY!!!
            const data = {
                ...renderContact(selfContact),
                online: true,
                extra: {
                    last_scroll_position: undefined,
                    pushed_messages: 0,
                    fetch_messages_count: 0,
                    full_loaded: false,
                },
            };

            // Emitting to invite sender the new contact
            socket.emit(
                'update',
                socketActions.update(clientActions.USER_PUSH_DATA, {
                    field: 'contacts',
                    set: { data },
                }),
            );
            socket.emit(
                'warn',
                socketActions.warn(
                    'success',
                    `${selfContact.contact.username} aceitou o seu convite de amizade!`,
                ),
            );
        },

        /**
         * Sends a WebSocket event to the sender of the invite
         * @param invite - The invite that was refused
         */
        refuseInvite(invite: ContactInvitation) {
            const socket = wsUsers.get(invite.sender_id)?.socket;
            if (!socket) return;

            socket.emit(
                'warn',
                socketActions.warn(
                    'error',
                    `${invite.user.username} recusou o seu convite de amizade!`,
                ),
            );
        },

        /**
         * Sends a WebSocket event to the `Contact` that was blocked or unblocked
         * @param contacat - Is my contact that I have with the other user
         */
        block(contact: Contact) {
            const socket = wsUsers.get(contact.user_id)?.socket;
            const blocked = contact.you_blocked;

            socket?.emit(
                'update',
                socketActions.update(clientActions.UPDATE_ROOM, {
                    field: 'contacts',
                    where: { id: contact.contact_user_id },
                    set: { you_blocked: blocked },
                }),
            );

            socket?.to(contact.contact_user_id).emit(
                'update',
                socketActions.update(clientActions.UPDATE_ROOM, {
                    field: 'contacts',
                    where: { id: contact.contact_user_id },
                    set: { blocked },
                }),
            );

            socket
                ?.to(contact.contact_user_id)
                .emit(
                    'warn',
                    socketActions.warn(
                        !blocked ? 'info' : 'error',
                        `${contact.user.username} lhe ${
                            !blocked ? 'des' : ''
                        }bloqueou`,
                    ),
                );
        },

        /** Contact Messages Events */
        messages: {
            /**
             * Sends a WebSocket event to Sender and Receiver of the message
             * @param message - The Message for the sender of him
             * @param messageOfReceiver - The message  for the receiver of him
             * @param to - The User ID who's receiving the message
             */
            create(
                message: ContactMessage,
                messageOfReceiver: ContactMessage,
                to: string,
            ) {
                const socketSender = wsUsers.get(message.sender_id)?.socket;
                const socketReceiver = wsUsers.get(to)?.socket;

                socketSender?.emit(
                    'update',
                    socketActions.update(clientActions.PUSH_CONTACT_MESSAGE, {
                        set: { message: message },
                        where: { id: to },
                    }),
                );
                socketReceiver?.emit(
                    'update',
                    socketActions.update(clientActions.PUSH_CONTACT_MESSAGE, {
                        set: { message: messageOfReceiver },
                        where: { id: message.sender_id },
                    }),
                );
            },

            /**
             * Sends a event viewing all messages
             * @param id - The Target of the event
             * @param viewer_id - The User ID who's viewing the messsages
             * @param viewed_at - The date that be viewed
             */
            view(id: string, viewer_id: string, viewed_at: Date) {
                const socket = wsUsers.get(id)?.socket;
                if (!socket) return;

                socket.emit(
                    'update',
                    socketActions.update(clientActions.VIEW_CONTACT_MESSAGES, {
                        field: 'contacts',
                        where: { id: viewer_id },
                        set: { viewed: true, viewed_at },
                    }),
                );
            },

            /**
             *  Sends a WebSocket event to the receiver of the message
             * @param id - The Target of the event
             * @param sender_id - The User ID who sends the message
             * @param message_id  - The message ID was be deleted
             */
            deleteOne(id: string, sender_id: string, message_id: string) {
                const socket = wsUsers.get(id)?.socket;
                if (!socket) return;

                socket.emit(
                    'update',
                    socketActions.update(clientActions.REMOVE_ROOM_MESSAGE, {
                        field: 'contacts',
                        where: { id: sender_id, message_id },
                    }),
                );
            },
        },
    },

    /** Group Events */
    group: {
        /**
         * Sends a WebSocket event to all members of the group
         * @param creator_id - The User iD who's created the group
         * @param group
         */
        create(creator_id: string, group: Group) {
            group.users
                .filter(u => u.user_id !== creator_id)
                .forEach(u => {
                    const socket = wsUsers.get(u.user_id)?.socket;
                    if (!socket) return;

                    // Join in the group for future updates. ex: update group picture.
                    socket.join(group.id);
                    socket.emit(
                        'update',
                        socketActions.update(clientActions.USER_PUSH_DATA, {
                            field: 'groups',
                            set: { data: group },
                        }),
                    );
                });
        },

        /**
         * Sends a WebSocket event emitting the group update
         * @param updated_by - The User ID who update the group
         * @param group_id - The Group ID
         * @param data - The data that to be send to the update
         */
        update(updated_by: string, group_id: string, data: any) {
            const socket = wsUsers.get(updated_by)?.socket;
            if (!socket) return;

            socket.to(group_id).emit(
                'update',
                socketActions.update('UPDATE_ROOM', {
                    field: 'groups',
                    where: { id: group_id },
                    set: data,
                }),
            );
        },

        /**
         * Sends a WebSocket event to all members of the group
         * @param id - The User ID who's leaving the group
         * @param group_id - The group ID that was left
         */
        leave(id: string, group_id: string) {
            const socket = wsUsers.get(id)?.socket;
            if (!socket) return;

            socket.leave(group_id);
            socket.to(group_id).emit(
                'update',
                socketActions.update(clientActions.REMOVE_GROUP_USER, {
                    where: { id: group_id, member_id: id },
                }),
            );
        },

        /**
         * Sends a WebSocket event to all members of the group
         * @param id - The User ID who's deleted the group
         * @param group_id - The group ID that was deleted
         */
        delete(id: string, group_id: string) {
            const socket = wsUsers.get(id)?.socket;
            if (!socket) return;

            socket.to(group_id).emit(
                'update',
                socketActions.update(clientActions.USER_REMOVE_DATA, {
                    field: 'groups',
                    where: { id: group_id },
                }),
            );
        },

        /** Group Users Events */
        users: {
            /**
             * Sends a WebSocket event to all members of the group adding a new member
             * @param id
             * @param member
             */
            add(id: string, member: GroupUser) {
                const socket = wsUsers.get(id)?.socket;
                if (!socket) return;

                socket.to(member.group_id).emit(
                    'update',
                    socketActions.update(clientActions.PUSH_GROUP_USER, {
                        where: { id: member.group_id },
                        set: { member },
                    }),
                );
            },

            /**
             * Sends a WebSocket event to all members of the group updating the role of a member
             * @param id The User ID who's updated the member role
             */
            role(
                id: string,
                data: { group_id: string; member_id: string; role: number },
            ) {
                const socket = wsUsers.get(id)?.socket;
                if (!socket) return;

                const { group_id, member_id, role } = data;
                socket.to(group_id).emit(
                    'update',
                    socketActions.update(clientActions.UPDATE_GROUP_USER, {
                        where: { id: group_id, member_id },
                        set: { role },
                    }),
                );
            },

            /**
             * Sends a WebSocket event to all members of the group removing a member
             * @param id - The User ID who's removing the member
             * @param group_id The Group ID where the member gonna be removed
             * @param member_id - The Member ID that was gonna removed
             */
            remove(id: string, group_id: string, member_id: string) {
                const socket = wsUsers.get(id)?.socket;
                if (!socket) return;

                socket.to(group_id).emit(
                    'update',
                    socketActions.update(clientActions.REMOVE_GROUP_USER, {
                        where: { id: group_id, member_id },
                    }),
                );

                const removedMember = wsUsers.get(member_id)?.socket;
                removedMember?.leave(group_id);
            },
        },

        /** Group Messages Events */
        messages: {
            /**
             * Sends the `GroupMessage` to all members of the group
             * @param message
             */
            create(message: GroupMessage) {
                const socket = wsUsers.get(message.sender_id)?.socket;
                if (!socket) return;

                socket.to(message.group_id).emit(
                    'update',
                    socketActions.update(clientActions.PUSH_GROUP_MESSAGE, {
                        where: { id: message.group_id },
                        set: { message },
                    }),
                );
            },

            /**
             * Sends a WebSocket event to all members of the group
             * @param id - The User ID who's viewing the messages
             * @param group_id - The Group ID where the message are viewing
             * @param viewed_at - The date that be viewed
             */
            view(id: string, group_id: string, viewed_at: Date) {
                const socket = wsUsers.get(id)?.socket;
                if (!socket) return;

                socket.to(group_id).emit(
                    'update',
                    socketActions.update(clientActions.VIEW_GROUP_MESSAGES, {
                        where: { id: group_id },
                        set: { viewed_at },
                    }),
                );
            },

            /**
             * Sends a WebSocket event to all members of the group for delete the message
             * @param id - The User ID who's deleting the message
             * @param group_id  - The Group ID where the message is gonna deleted
             * @param message_id - The Message ID that be deleted
             */
            delete(id: string, group_id: string, message_id: string) {
                const socket = wsUsers.get(id)?.socket;
                if (!socket) return;

                socket.to(group_id).emit(
                    'update',
                    socketActions.update(clientActions.REMOVE_ROOM_MESSAGE, {
                        where: { id: group_id, message_id },
                    }),
                );
            },
        },
    },
};
