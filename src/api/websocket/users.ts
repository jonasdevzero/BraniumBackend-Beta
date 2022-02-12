import { Contact, User } from '../models';
import { Socket } from 'socket.io';
import { ws } from '../plugins/websocket';
import { constants } from '../../config/constants';

const {
    socketActions,
    client: { actions: clientActions },
} = constants;

interface SocketUser {
    user: User;
    socket: Socket;
    rooms: string[];
}

export default class SocketUsers {
    users: Map<string, SocketUser>;

    constructor() {
        this.users = new Map();
    }

    get(id: string) {
        return this.users.get(id);
    }

    set(id: string, user: SocketUser) {
        this.users.set(id, user);
    }

    remove(id: string) {
        this.users.delete(id);
    }

    // Contacts methods
    pushContact(id: string, contact: Contact) {
        const wsUser = this.get(id);
        if (!wsUser) return;

        wsUser.user.contacts.push(contact);
        this.set(id, wsUser);
    }

    getContactsOnline(id: string) {
        const user = this.get(id)?.user;
        if (!user) return [];

        const contactsOnline: string[] = [];
        for (const { contact_user_id } of user.contacts) {
            !!this.get(contact_user_id)
                ? contactsOnline.push(contact_user_id)
                : null;
        }

        return contactsOnline;
    }

    emitToContacts(id: string, event: string, ...args: any[]) {
        const socket = this.get(id)?.socket;
        if (!socket) return;

        const contacts = this.getContactsOnline(id);
        for (const c of contacts) 
            ws.to(c).emit(event, ...args);
    }

    // Rooms methods
    pushRoom(id: string, roomId: string) {
        const wsUser = this.get(id);
        if (!wsUser) return;

        const newRooms = [...wsUser.rooms, roomId];
        wsUser.rooms = newRooms;
        this.set(id, wsUser);
    }

    removeRoom(id: string, roomId: string) {
        const wsUser = this.get(id);
        if (!wsUser) return;

        const updatedRooms = wsUser.rooms.filter(r => r !== roomId);
        wsUser.rooms = updatedRooms;
        this.set(id, wsUser);
    }

    /**
     * Emit event to all rooms if the User is `online` or `offline`
     */
    emitStatusToRooms(id: string, status: boolean) {
        const wsUser = this.get(id);
        if (!wsUser) return;

        wsUser.rooms.forEach(r =>
            ws.to(r).emit(
                'update',
                socketActions.update(clientActions.UPDATE_GROUP_USER, {
                    where: { id: r, member_id: id },
                    set: { online: status },
                }),
            ),
        );
    }
}
