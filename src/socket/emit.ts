import { wsUsers } from "./"
import { ContactInvitation, Contact, ContactMessage } from "../models"
import { renderContact } from "../routes/_preSerializer/contactSerializer"

/**
 * Object with `socket.emit` events
 */
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

            socket.emit("update", { type: "USER_PUSH_DATA", data: i, dataKey: "contact_invitations" })
            socket.emit("warn", { type: "info", message: `${i.sender.username} enviou um convite de amizade!` })
        },
        
        // receiver: who receiver the invite and accept them
        acceptInvite(receiver: Contact, sender: Contact) {
            const socket = wsUsers.get(sender.user_id)?.socket
            if (!socket) return;

            wsUsers.pushContact(receiver.user_id, receiver)
            wsUsers.pushContact(sender.user_id, sender)

            // Emitting to invite sender the new contact
            socket.emit("update", { type: "USER_PUSH_DATA", data: { ...renderContact(sender), online: true }, dataKey: "contacts" })
            socket.emit("warn", { type: "success", message: `${sender.contact.username} aceitou o seu convite de amizade!` })
        },
        
        refuseInvite(i: ContactInvitation) {
            const socket = wsUsers.get(i.sender_id)?.socket
            if (!socket) return;

            socket.emit("warn", { type: "error", message: `${i.user.username} recusou o seu convite de amizade!` })
        },

        message(senderMessage: ContactMessage, receiverMessage: ContactMessage, to: string) {
            const socketSender = wsUsers.get(senderMessage.sender_id)?.socket
            const socketReceiver = wsUsers.get(to)?.socket

            socketSender?.emit("update", { type: "PUSH_CONTACT_MESSAGE", message: senderMessage, where: to })
            socketReceiver?.emit("update", { type: "PUSH_CONTACT_MESSAGE", message: receiverMessage, where: senderMessage.sender_id })
        }
    },
}

export default emit 
