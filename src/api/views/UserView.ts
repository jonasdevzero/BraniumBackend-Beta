import { FastifyRequest, FastifyReply, DoneFuncWithErrOrRes } from "fastify"
import { User } from "../models"
import { renderContact } from "./ContactView"

export function serializeAuth(_req: FastifyRequest, _reply: FastifyReply, payload: any, done: DoneFuncWithErrOrRes) {
    const { user } = payload
    user ? done(null, { user: renderUser(user) }) : done(null, payload)
}

function renderUser(user: User) {
    const { id, name, username, picture, email, contacts, contact_invitations } = user 
        return {
            id,
            name,
            username,
            email,
            picture,
            contact_invitations: contact_invitations,
            contacts: renderContact(contacts),
        }
}
