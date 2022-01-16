import { getRepository, ILike } from 'typeorm';
import { userUtil } from '../helpers';
import { PreRegistration, User } from '../models';

// eslint-disable-next-line
let rEmail =
    /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;

export default {
    /**
     * Search users
     * @param id the id of whoever is searching
     * @param username username being searched
     */
    search(id: string, username: string): Promise<User[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const userRepository = getRepository(User);
                const [user, users] = await Promise.all([
                    userRepository.findOne(id, {
                        relations: ['contacts', 'invitations_sent'],
                        withDeleted: true,
                    }),
                    userRepository.find({
                        where: { username: ILike(`%${username}%`) },
                        take: 20,
                        withDeleted: true,
                    }),
                ]);

                if (!user)
                    return reject({
                        status: 400,
                        message: 'Conta não encontrada!',
                    });

                if (user.deleted_at)
                    return reject({
                        status: 400,
                        message: 'Sua conta foi deletada! Restaure-a!',
                    });

                const existentContacts = [user.id];
                user.contacts.forEach(c =>
                    existentContacts.push(c.contact_user_id),
                );
                user.invitations_sent.forEach(i =>
                    i.pending ? existentContacts.push(i.receiver_id) : null,
                );

                const filteredSearch = users.filter(
                    u => !existentContacts.includes(u.id) && !u.deleted_at,
                );

                resolve(filteredSearch);
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
     * Pre register a new user
     * @returns Returns the PreRegistration Id
     */
    preRegister(data: { name: string; email: string }): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const { email } = data;

                const preRegistrationRepo = getRepository(PreRegistration);
                const existsPreRegistration = await preRegistrationRepo.findOne(
                    { where: { email } },
                );

                if (existsPreRegistration)
                    return reject({
                        status: 400,
                        message: `Email já registrado!${
                            existsPreRegistration.pending
                                ? ' Finalize seu cadastro!'
                                : ''
                        }`,
                    });

                const preRegistration = await preRegistrationRepo
                    .create(data)
                    .save();

                resolve(preRegistration.id);
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
     * Register a new User
     * @returns Returns the id of the new user
     */
    register(
        preRegistrationId: string,
        data: { username: string; password: string },
    ): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const { username, password } = data;

                const preRegistrationRepo = getRepository(PreRegistration);
                const userRepository = getRepository(User);

                const [preRegistration, existsUsername] = await Promise.all([
                    preRegistrationRepo.findOne(preRegistrationId),
                    userRepository.findOne({ where: { username } }),
                ]);

                if (!preRegistration)
                    return reject({
                        status: 404,
                        message: 'Cadastro não encontrado!',
                    });

                if (!preRegistration.pending)
                    return reject({
                        status: 400,
                        message: 'Cadastro já realizado!',
                    });

                if (existsUsername)
                    return reject({ status: 400, message: 'Username em uso!' });

                const { name, email } = preRegistration;

                const [user] = await Promise.all([
                    userRepository
                        .create({ name, email, username, password })
                        .save(),
                    preRegistrationRepo.update(preRegistration, {
                        pending: false,
                    }),
                ]);

                resolve(user.id);
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
     * Validate password
     * @param login - The "username" or "email" of an user
     * @param password - The password that will be validated
     * @returns Returns the user id if it has been validated
     */
    validatePassword(login: string, password: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const isEmail = rEmail.test(login);
                const target = isEmail ? 'email' : 'username';

                const user = await getRepository(User).findOne({
                    where: { [target]: login },
                    withDeleted: true,
                });

                if (!user)
                    return reject({
                        status: 400,
                        messsage: `"${target}" incorreto`,
                    });

                if (user.deleted_at)
                    return reject({
                        status: 400,
                        message: 'Sua conta foi deletada! Restaure-a!',
                    });

                if (!userUtil.comparePasswords(password, user.password))
                    return reject({ status: 401, message: 'Senha Incorreta!' });

                resolve(user.id);
            } catch (error) {
                reject({
                    status: 500,
                    message: 'Internal Server Error',
                    error,
                });
            }
        });
    },

    resetPassword(data: {
        reset_token: string;
        password: string;
    }): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const { reset_token, password } = data;

                const userRepository = getRepository(User);
                const user = await userRepository.findOne({
                    where: { reset_token },
                    withDeleted: true,
                });

                if (!user)
                    return reject({
                        status: 400,
                        message: 'Usuário não encontrado!',
                    });

                if (new Date() > user.expire_token)
                    return reject({
                        status: 400,
                        message: 'Token expirado, peça outro!',
                    });

                await userRepository.update(user.id, {
                    password: userUtil.encryptPassword(password),
                    reset_token: undefined,
                    expire_token: undefined,
                });

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
