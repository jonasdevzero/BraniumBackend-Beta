import { getRepository } from 'typeorm';
import { ServerReply, ServerRequest } from '../../interfaces/controller';
import { Group, GroupUser, User } from '../../models';

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
            const id = req.user;
            const { group_id, user_id } = req.body;

            const groupRepository = getRepository(Group);
            const group = await groupRepository.findOne(group_id, {
                relations: ['users'],
            });

            if (!group)
                return reply
                    .status(404)
                    .send({ message: 'Grupo não encontrado!' });

            if (group.users.find(u => u.user_id === id)?.role !== 0)
                return reply.status(401).send({
                    message: 'Você não pode adicionar novos usuários!',
                });

            const user = await getRepository(User).findOne(user_id);
            if (!user)
                return reply
                    .status(404)
                    .send({ message: 'Usuário não encontrado!' });

            const groupUserRepository = getRepository(GroupUser);

            group.created_by === user_id
                ? await groupRepository.update(group_id, { leader_id: user_id })
                : null;

            const date = new Date();
            const role = group.created_by === user_id ? 0 : 1;

            const member_since =
                group.created_by === user_id ? group.created_at : date;

            const role_since =
                group.created_by === user_id ? group.created_at : date;

            const member = await groupUserRepository
                .create({
                    group,
                    user_id,
                    role,
                    member_since,
                    role_since,
                })
                .save();

            reply.status(201).send({ member });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async role(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user;
            const { group_id, member_id, role } = req.body;

            if (id === member_id)
                return reply.status(401).send({
                    message: 'Você não pode mudar sua própria função!',
                });

            if (typeof role !== 'number')
                return reply.status(400).send({
                    message: 'Campo "role" deve ser do tipo "number"!',
                });

            if (![0, 1].includes(role))
                return reply
                    .status(400)
                    .send({ message: 'Função não permitida!' });

            const groupRepository = getRepository(Group);
            const group = await groupRepository.findOne(group_id, {
                relations: ['users'],
            });

            if (!group)
                return reply
                    .status(404)
                    .send({ message: 'Grupo não encontrado!' });

            const admin = group.users.find(u => u.user_id === id);
            const member = group.users.find(u => u.user_id === member_id);

            if (!admin)
                return reply.status(401).send({
                    message: 'Você não pode mudar a função de nenhum membro!',
                });

            if (!member)
                return reply
                    .status(401)
                    .send({ message: 'Membro não encontrado!' });

            if (admin.role !== 0)
                return reply.status(401).send({
                    message: 'Você não pode mudar a função de nenhum membro!',
                });

            if (member.role === 0 && admin.user_id !== group.leader_id)
                return reply.status(401).send({
                    message: 'Você não pode mudar a função de um admin!',
                });

            await getRepository(GroupUser).update(member, { role });

            reply.status(200).send({ role });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async remove(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user;
            const { group_id, member_id } = req.body;

            const groupRepository = getRepository(Group);
            const group = await groupRepository.findOne(group_id, {
                relations: ['users'],
            });

            if (!group)
                return reply
                    .status(404)
                    .send({ message: 'Grupo não encontrado!' });

            const admin = group.users.find(u => u.user_id === id);
            const member = group.users.find(u => u.user_id === member_id);

            if (!admin)
                return reply.status(401).send({
                    message: 'Você não pode remover nenhum membro!',
                });

            if (!member)
                return reply
                    .status(401)
                    .send({ message: 'Membro não encontrado!' });

            if (admin.role !== 0)
                return reply.status(401).send({
                    message: 'Você não pode remover nenhum membro!',
                });

            if (member.role === 0 && admin.user_id !== group.leader_id)
                return reply.status(401).send({
                    message: 'Você não pode remover um admin!',
                });

            await getRepository(GroupUser).delete(member);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },
};
