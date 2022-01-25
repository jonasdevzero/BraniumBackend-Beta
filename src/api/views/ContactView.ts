import { FastifyRequest, FastifyReply, DoneFuncWithErrOrRes } from 'fastify';
import { Contact } from '../models';

export default function serialize(
    _req: FastifyRequest,
    _reply: FastifyReply,
    payload: any,
    done: DoneFuncWithErrOrRes,
) {
    const { contact } = payload;
    contact
        ? done(null, { ...payload, contact: renderContact(contact) })
        : done();
}

export function renderContact(contact: Contact | Contact[]) {
    return Array.isArray(contact) ? renderMany(contact) : renderOne(contact);
}

function renderOne(c: Contact) {
    const {
        contact: { id, username, picture },
        unread_messages,
        last_message_time,
        blocked,
        you_blocked,
    } = c;
    return {
        id,
        username,
        picture,
        messages: [],
        unread_messages,
        last_message_time,
        blocked,
        you_blocked,

        extra: {
            last_scroll_position: -1,
            pushed_messages: 0,
            fetch_messages_count: 0,
            full_loaded: false,
        },
    };
}

function renderMany(contacts: Contact[]) {
    return contacts.map(contact => renderOne(contact)) ?? [];
}
