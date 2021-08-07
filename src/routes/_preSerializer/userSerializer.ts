import { FastifyRequest, FastifyReply, DoneFuncWithErrOrRes } from "fastify"
import { User } from "../../models"
import { renderContact } from "./contactSerializer"

export function serializeAuth(_req: FastifyRequest, _reply: FastifyReply, payload: any, done: DoneFuncWithErrOrRes) {
    const { user } = payload
    done(null, { user: renderUser(user) })
}

function renderUser(user: User) {
    const { id, name, username, picture, email, contacts, contact_invitations } = user 
        return {
            id,
            name,
            username,
            email,
            picture,
            invitations: contact_invitations,
            contacts: renderContact(contacts),
        }
}
