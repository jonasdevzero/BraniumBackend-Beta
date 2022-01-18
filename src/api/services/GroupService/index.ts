import { getRepository } from 'typeorm';
import { upload } from '../../helpers';
import { Group, GroupUser, User } from '../../models';

interface CreateGroupI {
    name: string;
    description: string;
    picture: any;
    members: string[];
}

interface UpdateGroupI {
    group_id: string;
    name: string;
    description: string;
}

export default {
    /**
     * Create a new group
     * @param id The User ID who is creating the group
     * @returns Returns the group created
     */
    createGroup(id: string, data: CreateGroupI): Promise<Group> {
        return new Promise(async (resolve, reject) => {
            try {
                const { name, description, picture, members } = data;

                const groupRepository = getRepository(Group);
                const date = new Date();

                const user = await getRepository(User).findOne(id, {
                    relations: ['contacts'],
                });

                if (!user)
                    return reject({
                        status: 404,
                        message: 'Sua conta não foi encontrada',
                    });

                // allows you to only put contacts as a member of a group
                const membersArr = (
                    Array.isArray(members) ? members : [members]
                ).filter(
                    m => !!user.contacts.find(c => c.contact_user_id === m),
                );

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

                resolve(group);
            } catch (error) {
                reject({
                    status: 500,
                    message: 'Internal Server Error',
                    error,
                });
            }
        });
    },

    /**
     * Update a group
     * @param id The User ID who is updating the group data
     */
    updateGroup(id: string, data: UpdateGroupI): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const { group_id, name, description } = data;

                const groupRepository = getRepository(Group);
                const group = await groupRepository.findOne(group_id, {
                    relations: ['users'],
                });

                if (!group)
                    return reject({
                        status: 404,
                        message: 'Grupo não encontrado!',
                    });

                if (group.users.find(u => u.user_id === id)?.role !== 0)
                    return reject({
                        status: 401,
                        message: 'Você não é um admin do grupo!',
                    });

                await groupRepository.update(group_id, { name, description });

                resolve();
            } catch (error) {
                reject({
                    status: 500,
                    message: 'Internal Server Error',
                    error,
                });
            }
        });
    },

    /**
     * 
     * @param id The User ID who is updating the group picture
     * @returns Returns the picture url
     */
    updatePicture(
        id: string,
        { group_id, picture }: { group_id: string; picture: any },
    ): Promise<string | undefined> {
        return new Promise(async (resolve, reject) => {
            try {
                const groupRepository = getRepository(Group);
                const group = await groupRepository.findOne(group_id, {
                    relations: ['users'],
                });

                if (!group)
                    return reject({
                        status: 404,
                        message: 'Grupo não encontrado!',
                    });

                if (group.users.find(u => u.user_id === id)?.role !== 0)
                    return reject({
                        status: 404,
                        message: 'Você não é um admin do grupo!',
                    });

                let picture_url: string | undefined;

                if (picture) {
                    const [{ Location }] = await Promise.all([
                        upload.save(picture),
                        group.picture
                            ? upload.remove(group.picture)
                            : undefined,
                    ]);
                    picture_url = Location;
                } else {
                    group.picture ? await upload.remove(group.picture) : null;
                }

                await groupRepository.update(group_id, {
                    picture: picture_url,
                });

                resolve(picture_url);
            } catch (error) {
                reject({
                    status: 500,
                    message: 'Internal Server Error',
                    error,
                });
            }
        });
    },

    /**
     * Leave a group
     * @param id The User ID who is leaving the group
     * @param group_id The group who is being leaved 
     */
    leaveGroup(id: string, group_id: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const groupRepository = getRepository(Group);
                const groupUserRepository = getRepository(GroupUser);

                const group = await groupRepository.findOne(group_id, {
                    relations: ['users'],
                });

                if (!group)
                    return reject({
                        status: 404,
                        message: 'Grupo não encontrado!',
                    });

                const member = group.users.find(u => u.user_id === id);

                if (!member)
                    return reject({
                        status: 401,
                        message: 'Você não está no grupo!',
                    });

                if (id === group.leader_id) {
                    const oldestAdmin = group.users
                        .filter(u => u.role === 0 && u.user_id !== id)
                        .sort((a, b) =>
                            a.role_since > b.role_since ? 1 : -1,
                        )[0];

                    if (oldestAdmin) {
                        await groupRepository.update(group_id, {
                            leader_id: oldestAdmin.user_id,
                        });
                    } else {
                        const oldestUser = group.users
                            .filter(u => u.user_id !== id)
                            .sort((a, b) =>
                                a.role_since > b.role_since ? 1 : -1,
                            )[0];

                        if (oldestUser) {
                            await Promise.all([
                                groupRepository.update(group_id, {
                                    leader_id: oldestUser.user_id,
                                }),
                                groupUserRepository.update(oldestUser.id, {
                                    role: 0,
                                    role_since: new Date(),
                                }),
                            ]);
                        } else await groupRepository.delete(group_id);
                    }
                }

                await groupUserRepository.delete(member);

                resolve();
            } catch (error) {
                reject({
                    status: 500,
                    message: 'Internal Server Error',
                    error,
                });
            }
        });
    },

    /**
     * Delete a group
     * @param id The User ID who is deleting the group
     * @param group_id The group who is being deleted
     */
    deleteGroup(id: string, group_id: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const groupRepository = getRepository(Group);
                const group = await groupRepository.findOne(group_id, {
                    relations: ['users'],
                });

                if (!group)
                    return reject({
                        status: 404,
                        message: 'Grupo não encontrado!',
                    });

                if (id !== group.leader_id)
                    return reject({
                        status: 401,
                        message: 'Você não pode deletar o grupo!',
                    });

                await Promise.all([
                    groupRepository.delete(group_id),
                    group.picture ? upload.remove(group.picture) : null,
                ]);

                resolve()
            } catch (error) {
                reject({
                    status: 500,
                    message: 'Internal Server Error',
                    error,
                });
            }
        });
    },
};
