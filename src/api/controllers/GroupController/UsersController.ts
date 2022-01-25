import { getRepository } from 'typeorm';
import { ServerReply, ServerRequest } from '../../interfaces/controller';
import GroupUsersService from '../../services/GroupService/UsersService';
import { GroupUser } from '../../models';
import WebSocketService from '../../services/WebSocketService';

export default {
    async index(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user;
            const group_id = req.params.group_id;

            const groupUsersRepository = getRepository(GroupUser);
            const users = await groupUsersRepository.find({
                where: { group_id },
                relations: ['user'],
            });

            if (!users.find(u => u.user_id === id))
                return reply
                    .status(401)
                    .send({ message: 'Você não está no grupo!' });

            reply.status(200).send({ users });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async add(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const { group_id, user_id } = req.body;

            const member = await GroupUsersService.addMember(id, {
                group_id,
                user_id,
            });
            WebSocketService.group.users.add(member);

            reply.status(201).send({ member });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async role(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const { role } = req.body;

            await GroupUsersService.updateRole(id, req.body);
            WebSocketService.group.users.role(req.body);

            reply.status(200).send({ role });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async remove(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const { group_id, member_id } = req.body;

            await GroupUsersService.removeMember(id, { group_id, member_id });
            WebSocketService.group.users.remove(group_id, member_id);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },
};
