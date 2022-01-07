import { wsUsers } from "."
import { ContactInvitation, Contact, ContactMessage } from "../models"
import { renderContact } from "../views/ContactView"
import * as Actions from "./actions"

const emit = {
    /** User Events */
    user: {
        update() {

        },
    },

    /** Contact Events */
    contact: {
        invite(i: ContactInvitation) {
            const socket = wsUsers.get(i.receiver_id)?.socket
            if (!socket) return;

            socket.emit("update", Actions.update("USER_PUSH_DATA", { field: "contact_invitations", set: { data: i } }))
            socket.emit("warn", Actions.warn("info", `${i.sender.username} enviou um convite de amizade!`))
        },

        // receiver: who receiver the invite and accept them
        acceptInvite(receiver: Contact, sender: Contact) {
            const socket = wsUsers.get(sender.user_id)?.socket
            if (!socket) return;

            wsUsers.pushContact(receiver.user_id, receiver)
            wsUsers.pushContact(sender.user_id, sender)

            const data = { 
                ...renderContact(sender), 
                online: true,
                extra: {
                    last_scroll_position: undefined,
                    pushed_messages: 0,
                    fetch_messages_count: 0,
                    full_loaded: false,
                }
            }
            // Emitting to invite sender the new contact
            socket.emit("update", Actions.update("USER_PUSH_DATA", { field: "contacts", set: { data } }))
            socket.emit("warn", Actions.warn("success", `${sender.contact.username} aceitou o seu convite de amizade!`))
        },

        refuseInvite(i: ContactInvitation) {
            const socket = wsUsers.get(i.sender_id)?.socket
            if (!socket) return;

            socket.emit("warn", Actions.warn("error", `${i.user.username} recusou o seu convite de amizade!`))
        },

        block(myContact: Contact, contact: Contact) {
            const socket = wsUsers.get(myContact.user_id)?.socket
            const contactSocket = wsUsers.get(contact.user_id)?.socket
            const blocked = !contact.blocked

            socket?.emit("update", Actions.update("UPDATE_ROOM", { field: "contacts", where: { id: myContact.contact_user_id }, set: { you_blocked: blocked } }))
            
            contactSocket?.emit("update", Actions.update("UPDATE_ROOM", { field: "contacts", where: { id: contact.contact_user_id }, set: { blocked } })) 
            contactSocket?.emit("warn", Actions.warn(!blocked ? "info" : "error", `${myContact.user.username} lhe ${!blocked ? "des" : ""}bloqueou`))
        },

        message(senderMessage: ContactMessage, receiverMessage: ContactMessage, to: string) {
            const socketSender = wsUsers.get(senderMessage.sender_id)?.socket
            const socketReceiver = wsUsers.get(to)?.socket

            socketSender?.emit("update", Actions.update("PUSH_CONTACT_MESSAGE", { set: { message: senderMessage }, where: { id: to } }))
            socketReceiver?.emit("update", Actions.update("PUSH_CONTACT_MESSAGE", { set: { message: receiverMessage }, where: { id: senderMessage.sender_id } }))
        }
    },
}

export default emit
