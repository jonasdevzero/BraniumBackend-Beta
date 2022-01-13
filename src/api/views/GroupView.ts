import { DoneFuncWithErrOrRes, FastifyReply, FastifyRequest } from 'fastify';
import { Group, GroupUser } from '../models';

export default function serialize(
    _req: FastifyRequest,
    _reply: FastifyReply,
    payload: any,
    done: DoneFuncWithErrOrRes,
) {
    const { group } = payload;
    group ? done() : done();
}

export function renderGroup(group: Group | Group[]) {
    return Array.isArray(group) ? renderMany(group) : renderOne(group);
}

function renderOne(group: Group) {
    const { id, name, picture, description, created_at, leader_id } = group;

    return {
        id,
        name,
        picture,
        description,
        created_at,
        leader_id,
        users: [],
        messages: [],
    };
}

function renderMany(groups: Group[]) {
    return groups.map(g => renderOne(g));
}

export function renderGroupsFromUser(groups: GroupUser[]) {
    return groups.map(g => {
        const { group, role, unread_messages } = g;
        return {
            ...renderOne(group),
            role,
            unread_messages,
        };
    });
}
