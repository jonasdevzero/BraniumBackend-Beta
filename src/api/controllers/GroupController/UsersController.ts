import { getRepository } from 'typeorm';
import { ServerReply, ServerRequest } from '../../interfaces/controller';
import GroupUserService from '../../services/GroupService/UsersService';
import { GroupUser } from '../../models';

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

            const member = await GroupUserService.addMember(id, {
                group_id,
                user_id,
            });

            reply.status(201).send({ member });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async role(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const { role } = req.body;

            await GroupUserService.updateRole(id, req.body);

            reply.status(200).send({ role });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async remove(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;

            await GroupUserService.removeMember(id, req.body);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },
};
