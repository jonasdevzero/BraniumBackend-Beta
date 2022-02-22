import { getRepository } from 'typeorm';
import { ServerReply, ServerRequest } from '../../interfaces/controller';
import GroupService from '../../services/GroupService';
import { Group } from '../../models';
import WebSocketService from '../../services/WebSocketService';

export default {
    async show(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user;
            const group_id = req.params.id;

            const groupRepository = getRepository(Group);
            const group = await groupRepository.findOne(group_id, {
                relations: ['users'],
            });

            if (!group)
                return reply
                    .status(404)
                    .send({ message: 'Grupo não encontrado!' });

            const groupUser = group.users.find(u => u.user_id === id);

            if (!groupUser)
                return reply
                    .status(401)
                    .send({ message: 'Você não está no grupo!' });

            // For correctly render
            groupUser.group = group;

            reply.status(200).send({ group: groupUser });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async create(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;

            const group = await GroupService.createGroup(id, req.body);
            WebSocketService.group.create(id, group);

            // For correctly render
            const groupUser = group.users.find(u => u.user_id === id);
            groupUser!.group = group;

            reply.status(201).send({ group: groupUser });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async update(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const group_id = req.params.id;
            const { name, description } = req.body;

            await GroupService.updateGroup(id, {
                group_id,
                name,
                description,
            });
            WebSocketService.group.update(group_id, { name, description });

            reply.status(200).send({ name, description });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async update_picture(req: ServerRequest, reply: ServerReply) {
        try {
            if (!req.isMultipart())
                return reply
                    .status(400)
                    .send({ message: 'Envie os dados no formato Multipart!' });

            const id = req.user as string;
            const group_id = req.params.id;
            const { picture } = req.body;

            const picture_url = await GroupService.updatePicture(id, {
                group_id,
                picture,
            });
            WebSocketService.group.update(group_id, {
                picture: picture_url,
            });

            reply.status(200).send({ picture: picture_url });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async leave(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const group_id = req.params.id;

            const [leader_id, new_leader] = await GroupService.leaveGroup(
                id,
                group_id,
            );
            WebSocketService.group.leave(id, group_id);
            WebSocketService.group.update(group_id, { leader_id });

            new_leader
                ? WebSocketService.group.users.update(group_id, leader_id, {
                      role: 0,
                  })
                : null;

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async delete(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const group_id = req.params.id;

            await GroupService.deleteGroup(id, group_id);
            WebSocketService.group.delete(group_id);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },
};
