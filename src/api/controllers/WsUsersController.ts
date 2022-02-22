import { constants } from '../../config/constants';

const clientActions = constants.client.actions;

interface WsUser {
    socketId: string;
    contacts: string[];
    groups: string[];
}

const kWsUsers = Symbol('kWsUsers');
export default class WsUsersController {
    [kWsUsers]: Map<string, WsUser>;

    constructor() {
        this[kWsUsers] = new Map();
    }

    /**
     * Find one WsUser by `User ID`
     * @param userId - The User ID
     */
    findOne(userId: string) {
        return this[kWsUsers].get(userId);
    }

    /**
     * Sets a new WsUser where the key is the `User ID`
     * @param userId - The User ID
     * @param user - The WsUser that be seted
     */
    set(userId: string, user: WsUser) {
        this[kWsUsers].set(userId, user);

        return this;
    }

    /**
     * Removes a WsUser and emit a event to all contacts and group informing the logout
     * @param userId - The User ID
     */
    remove(userId: string) {
        this.broadcastToContacts(userId, 'update', {
            type: clientActions.UPDATE_ROOM,
            field: 'contacts',
            where: { id: userId },
            set: { online: false },
        }).broadcastToGroups(userId, 'update', (group_id: string) => ({
            type: clientActions.UPDATE_GROUP_USER,
            where: { id: group_id, member_id: userId },
            set: { online: false },
        }));

        this[kWsUsers].delete(userId);
    }

    /**
     * Check if a user is online
     * @param userId - The User Id that gonna be checked
     */
    isOnline(userId: string) {
        return this[kWsUsers].has(userId);
    }

    /* ---------- Contact Methods ---------- */

    /**
     * Add a new contact to the WsUser for webwocket events
     * @param userId - The `User ID` that adding the new contact
     * @param contactId - The `User ID` of the contact
     */
    addContact(userId: string, contactId: string) {
        const wsUser = this.findOne(userId);
        if (!wsUser) return this;

        wsUser.contacts.push(contactId);
        this[kWsUsers].set(userId, wsUser);

        return this;
    }

    /**
     * Get all contacts online
     * @param userId -The `User ID` that's getting your contacts online
     * @returns Returns a String[ ] with the `User ID` of each contact
     */
    getContactsOnline(userId: string) {
        const wsUser = this[kWsUsers].get(userId);
        if (!wsUser) return [];

        const contactsOnline = wsUser.contacts.filter(c => this.isOnline(c));

        return contactsOnline;
    }

    /**
     * Broadcast a event to all contacts
     * @param userId - The User ID that's sending the event
     * @param event - The event name
     * @param args - The arguments of the event
     */
    broadcastToContacts(userId: string, event: string, action: any) {
        const contacts = this.getContactsOnline(userId);

        for (const c of contacts) globalThis.ws.to(c).emit(event, action);

        return this;
    }

    /* ---------- Group Methods ---------- */

    /**
     * Add a new group to WsUser and join in the socket room
     * @param userId - The User ID that's adding the group
     * @param groupId - The Group ID that's be added
     */
    addGroup(userId: string, groupId: string) {
        const wsUser = this.findOne(userId);
        if (!wsUser) return;

        const socket = globalThis.ws.sockets.sockets.get(wsUser.socketId);
        socket?.join(groupId);

        wsUser.groups.push(groupId);
        this[kWsUsers].set(userId, wsUser);
    }

    /**
     * Removes a group and leave it
     * @param userId - The User that's removing the group
     * @param groupId - The group that's be removed
     */
    removeGroup(userId: string, groupId: string) {
        const wsUser = this.findOne(userId);
        if (!wsUser) return;

        const socket = globalThis.ws.sockets.sockets.get(wsUser.socketId);
        socket?.leave(groupId);

        wsUser.groups = wsUser.groups.filter(g => g !== groupId);
        this[kWsUsers].set(userId, wsUser);
    }

    /**
     * Broadcast a event to all groups
     * @param userId - The User ID that's sending the event
     * @param event - The event name
     * @param cb - The callback where the first param is the group ID where the event be sent and returns the action of event
     */
    broadcastToGroups(
        userId: string,
        event: string,
        cb: (group_id: string) => {
            type: string;
            where?: { [key: string]: any };
            set?: any;
        },
    ) {
        const wsUser = this.findOne(userId);
        if (!wsUser) return this;

        for (const g of wsUser.groups) {
            const action = cb(g);
            globalThis.ws.to(g).emit(event, action);
        }

        return this;
    }
}
