import { DoneFuncWithErrOrRes, FastifyReply, FastifyRequest } from 'fastify';
import { Group, GroupUser } from '../models';

export default function serialize(
    _req: FastifyRequest,
    _reply: FastifyReply,
    payload: any,
    done: DoneFuncWithErrOrRes,
) {
    const { group } = payload;
    group ? done(null, { group: renderGroupUser(group) }) : done(null, payload);
}

interface GroupAsUser {
    id: string;
    name: string;
    picture: string;
    description: string;
    created_at: Date;
    leader_id: string;
    last_message_time: Date;
    users: never[];
    messages: never[];
    
    role: number;
    unread_messages: number;
}

/**
 * Render groups from `GroupUser`
 * @param groups - The groups as group user
 * @returns Returns the group rendered more friendly to the frontend
 */
export function renderGroupUser(groups: GroupUser[] | GroupUser): GroupAsUser | GroupAsUser[] {
    return Array.isArray(groups)
        ? groups.map(g => renderOneGroupUser(g))
        : renderOneGroupUser(groups);
}

function renderOneGroupUser(g: GroupUser) {
    const { group, role, unread_messages } = g;
    return {
        ...renderOne(group),
        role,
        unread_messages,
    };
}

function renderOne(group: Group) {
    const {
        id,
        name,
        picture,
        description,
        created_at,
        leader_id,
        last_message_time,
    } = group;

    return {
        id,
        name,
        picture,
        description,
        created_at,
        leader_id,
        last_message_time,
        users: [],
        messages: [],
    };
}
