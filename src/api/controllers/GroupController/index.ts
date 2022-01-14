import { getRepository } from 'typeorm';
import { upload } from '../../helpers';
import { ServerReply, ServerRequest } from '../../interfaces/controller';
import { Group, GroupUser } from '../../models';

export default {
    async show(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user;
            const group_id = req.params.id;

            const groupRepository = getRepository(Group);
            const group = await groupRepository.findOne(group_id, {
                relations: ['users', 'users.user'],
            });

            if (!group)
                return reply
                    .status(404)
                    .send({ message: 'Grupo não encontrado!' });

            if (!group.users.find(u => u.user_id === id))
                return reply
                    .status(401)
                    .send({ message: 'Você não está no grupo!' });

            reply.status(200).send({ group });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async create(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const { name, description, picture, members } = req.body;

            const groupRepository = getRepository(Group);

            const date = new Date();
            const membersArr = (
                Array.isArray(members) ? members : [members]
            ).filter(m => m !== id);

            const picture_url = picture
                ? await upload.save(picture).then(p => p.Location)
                : undefined;

            const group = await groupRepository
                .create({
                    name,
                    description,
                    picture: picture_url,
                    created_by: id,
                    leader_id: id,
                })
                .save();

            const groupUserRepo = getRepository(GroupUser);
            const createUsers = [
                groupUserRepo
                    .create({
                        user_id: id,
                        role: 0,
                        role_since: date,
                        member_since: date,
                        group_id: group.id,
                    })
                    .save(),
            ];
            membersArr.forEach(m =>
                createUsers.push(
                    groupUserRepo
                        .create({
                            user_id: m,
                            role: 1,
                            role_since: date,
                            member_since: date,
                            group_id: group.id,
                        })
                        .save(),
                ),
            );
            group.users = await Promise.all(createUsers);

            reply.status(201).send({ group });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async update(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user;
            const group_id = req.params.id;
            const { name, description } = req.body;

            if (!name || !description)
                return reply.status(400).send({
                    message: 'Campos obrigatórios: "name" e "description"!',
                });

            const groupRepository = getRepository(Group);
            const group = await groupRepository.findOne(group_id, {
                relations: ['users'],
            });

            if (!group)
                return reply
                    .status(404)
                    .send({ message: 'Grupo não encontrado!' });

            if (group.users.find(u => u.user_id === id)?.role !== 0)
                return reply
                    .status(401)
                    .send({ message: 'Você não é um admin do grupo!' });

            await groupRepository.update(group_id, { name, description });

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

            const id = req.user;
            const group_id = req.params.id;
            const { picture } = req.body;

            const groupRepository = getRepository(Group);
            const group = await groupRepository.findOne(group_id, {
                relations: ['users'],
            });

            if (!group)
                return reply
                    .status(404)
                    .send({ message: 'Grupo não encontrado!' });

            if (group.users.find(u => u.user_id === id)?.role !== 0)
                return reply
                    .status(401)
                    .send({ message: 'Você não é um admin do grupo!' });

            let picture_url = undefined;

            if (picture) {
                const [{ Location }] = await Promise.all([
                    upload.save(picture),
                    group.picture ? upload.remove(group.picture) : undefined,
                ]);
                picture_url = Location;
            } else {
                group.picture ? await upload.remove(group.picture) : null;
            }

            await groupRepository.update(group_id, { picture: picture_url });

            reply.status(200).send({ picture: picture_url });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async leave(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user;
            const group_id = req.params.id;

            const groupRepository = getRepository(Group);
            const groupUserRepository = getRepository(GroupUser);

            const group = await groupRepository.findOne(group_id, {
                relations: ['users'],
            });

            if (!group)
                return reply
                    .status(404)
                    .send({ message: 'Grupo não encontrado!' });

            const member = group.users.find(u => u.user_id === id);

            if (!member)
                return reply
                    .status(401)
                    .send({ message: 'Você não está no grupo!' });

            if (id === group.leader_id) {
                // TEST
                const oldestAdmin = group.users
                    .filter(u => u.role === 0)
                    .reduce((prv, crr) =>
                        prv.role_since > crr.role_since ? crr : prv,
                    );

                if (oldestAdmin) {
                    await groupRepository.update(group_id, {
                        leader_id: oldestAdmin.user_id,
                    });
                } else {
                    const oldestUser = group.users.reduce((prv, crr) =>
                        prv.member_since > crr.member_since ? crr : prv,
                    );

                    oldestUser
                        ? await groupRepository.update(group_id, {
                              leader_id: oldestUser.user_id,
                          })
                        : await groupRepository.delete(group_id);
                }
            }

            await groupUserRepository.delete(member);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async delete(req: ServerRequest, reply: ServerReply) {
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

            if (id !== group.leader_id)
                return reply
                    .status(401)
                    .send({ message: 'Você não pode deletar o grupo!' });

            await Promise.all([
                groupRepository.delete(group_id),
                group.picture ? upload.remove(group.picture) : null,
            ]);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },
};
