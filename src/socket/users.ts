import { Contact, User } from "../models"
import { Socket } from "socket.io"

interface SocketUser {
    user: User
    socket: Socket
}

export default class SocketUsers {
    users: Map<string, SocketUser>

    constructor() {
        this.users = new Map()
    }
    
    get(id: string) {
        return this.users.get(id)
    }

    set(id: string, user: SocketUser) {
        this.users.set(id, user)
    }

    remove(id: string) {
        this.users.delete(id)
    }

    pushContact(id: string, contact: Contact) {
        const wsUser = this.get(id)
        if (!wsUser) return;

        wsUser.user.contacts.push(contact)
        this.set(id, wsUser)
    }

    getContactsOnline(id: string) {
        const user = this.get(id)?.user
        if (!user) return [];

        const contactsOnline: string[] = []
        for (const { contact_user_id } of user.contacts) {
            !!this.get(contact_user_id) ? contactsOnline.push(contact_user_id) : null;
        }

        return contactsOnline
    }
}
