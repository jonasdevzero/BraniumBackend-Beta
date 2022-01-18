import { getRepository } from 'typeorm';
import { Group, GroupUser, User } from '../../models';

interface UpdateRoleI {
    group_id: string;
    member_id: string;
    role: 0 | 1;
}

export default {
    /**
     * Add a User to a group
     * @param id The User ID who is adding a new member
     * @returns Return the new member
     */
    addMember(
        id: string,
        { group_id, user_id }: { group_id: string; user_id: string },
    ): Promise<GroupUser> {
        return new Promise(async (resolve, reject) => {
            try {
                const groupRepository = getRepository(Group);
                const userRpository = getRepository(User);

                const [group, admin] = await Promise.all([
                    groupRepository.findOne(group_id, {
                        relations: ['users'],
                    }),
                    userRpository.findOne(id, {
                        relations: ['contacts'],
                    }),
                ]);

                if (!group)
                    return reject({
                        status: 404,
                        message: 'Grupo não encontrado!',
                    });

                if (group.users.find(u => u.user_id === id)?.role !== 0)
                    return reject({
                        status: 401,
                        message: 'Você não pode adicionar novos usuários!',
                    });

                if (group.users.find(u => u.user_id === user_id))
                    return reject({
                        status: 400,
                        message: 'Esse usuário já esta no grupo!',
                    });

                if (!admin)
                    return reject({
                        status: 404,
                        message: 'Sua conta não foi encontrada!',
                    });

                if (!admin.contacts.find(c => c.contact_user_id === user_id))
                    return reject({
                        status: 401,
                        message:
                            'Você só pode adicionar um novo usuário se ele for seu contato!',
                    });

                const user = await userRpository.findOne(user_id);
                if (!user)
                    return reject({
                        status: 404,
                        message: 'Usuário não encontrado!',
                    });

                const groupUserRepository = getRepository(GroupUser);

                const date = new Date();
                const role = group.created_by === user_id ? 0 : 1;

                const member_since =
                    group.created_by === user_id ? group.created_at : date;

                const role_since =
                    group.created_by === user_id ? group.created_at : date;

                const [member] = await Promise.all([
                    groupUserRepository
                        .create({
                            group,
                            user_id,
                            user,
                            role,
                            member_since,
                            role_since,
                        })
                        .save(),
                    group.created_by === user_id
                        ? groupRepository.update(group_id, {
                              leader_id: user_id,
                          })
                        : null,
                ]);

                resolve(member);
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
     * Update the role of a member
     * @param id The User Id who is updating the role
     */
    updateRole(
        id: string,
        { group_id, member_id, role }: UpdateRoleI,
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                if (id === member_id)
                    return reject({
                        status: 401,
                        message: 'Você não pode mudar sua própria função!',
                    });

                const groupRepository = getRepository(Group);
                const group = await groupRepository.findOne(group_id, {
                    relations: ['users'],
                });

                if (!group)
                    return reject({
                        status: 404,
                        message: 'Grupo não encontrado!',
                    });

                const admin = group.users.find(u => u.user_id === id);
                const member = group.users.find(u => u.user_id === member_id);

                if (!admin)
                    return reject({
                        status: 401,
                        message:
                            'Você não pode mudar a função de nenhum membro!',
                    });

                if (!member)
                    return reject({
                        status: 404,
                        message: 'Membro não encontrado!',
                    });

                if (admin.role !== 0)
                    return reject({
                        status: 401,
                        message:
                            'Você não pode mudar a função de nenhum membro!',
                    });

                if (member.role === 0 && admin.user_id !== group.leader_id)
                    return reject({
                        status: 401,
                        message: 'Você não pode mudar a função de um admin!',
                    });

                await getRepository(GroupUser).update(member, { role });

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
     * Remove a member from a group
     * @param id The User Id who is removing
     */
    removeMember(
        id: string,
        { group_id, member_id }: { group_id: string; member_id: string },
    ): Promise<void> {
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

                const admin = group.users.find(u => u.user_id === id);
                const member = group.users.find(u => u.user_id === member_id);

                if (!admin)
                    return reject({
                        status: 401,
                        message: 'Você não pode remover nenhum membro!',
                    });

                if (!member)
                    return reject({
                        status: 401,
                        message: 'Membro não encontrado!',
                    });

                if (admin.role !== 0)
                    return reject({
                        status: 401,
                        message: 'Você não pode remover nenhum membro!',
                    });

                if (member.role === 0 && admin.user_id !== group.leader_id)
                    return reject({
                        status: 401,
                        message: 'Você não pode remover um admin!',
                    });

                await getRepository(GroupUser).delete(member);

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
};
