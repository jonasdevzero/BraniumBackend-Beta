import { DoneFuncWithErrOrRes, FastifyReply, FastifyRequest } from 'fastify';
import { GroupUser } from '../models';

export function serializeGroupUsers(field: string) {
    return (
        _req: FastifyRequest,
        _reply: FastifyReply,
        payload: any,
        done: DoneFuncWithErrOrRes,
    ) => {
        payload[field]
            ? done(null, { [field]: renderUsers(payload[field]) })
            : done(null, payload);
    };
}

export function renderUsers(users: GroupUser | GroupUser[]) {
    return Array.isArray(users) ? renderMany(users) : renderOne(users);
}

function renderOne(groupUser: GroupUser) {
    const {
        role,
        user: { id, username, picture },
    } = groupUser;
    
    return {
        id,
        username,
        picture,
        role,
    };
}

function renderMany(users: GroupUser[]) {
    return users.map(u => renderOne(u));
}
