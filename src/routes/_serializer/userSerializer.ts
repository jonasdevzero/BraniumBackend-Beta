import { FastifyRequest, FastifyReply, DoneFuncWithErrOrRes } from "fastify"
import User from "../../models/User"

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
            contacts,
        }
}