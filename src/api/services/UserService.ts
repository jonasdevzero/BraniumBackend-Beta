import { getRepository, ILike, Not } from 'typeorm';
import { crypt, upload } from '../helpers';
import { PreRegistration, User } from '../models';

// eslint-disable-next-line
let rEmail =
    /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
// eslint-disable-next-line
let rUuid =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

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

                // prevents the username from being in the form of a uuid
                if (rUuid.test(username))
                    return reject({
                        status: 400,
                        message: 'Formato de "username" inválido!',
                    });

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
     * @param login - The `id`, `username` or `email` of an user
     * @param password - The password that will be validated
     * @param requireDeleted - requires the account to have been deleted
     * @returns Returns the user id if it has been validated
     */
    validatePassword(
        login: string,
        password: string,
        requireDeleted?: boolean,
    ): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const isEmail = rEmail.test(login);
                const isId = rUuid.test(login);
                const target = isEmail ? 'email' : isId ? 'id' : 'username';

                const user = await getRepository(User).findOne({
                    where: { [target]: login },
                    withDeleted: true,
                });

                if (!user)
                    return reject({
                        status: 400,
                        messsage: `"${target}" incorreto`,
                    });

                if (requireDeleted && !user.deleted_at)
                    return reject({
                        status: 400,
                        message: 'Conta não deletada!',
                    });

                if (!requireDeleted && user.deleted_at)
                    return reject({
                        status: 400,
                        message: 'Sua conta foi deletada! Restaure-a!',
                    });

                if (!crypt.comparePasswords(password, user.password))
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

    /**
     * Create a reset token to update the `password`
     * @returns Returns the `reset_token`
     */
    createResetToken(email: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const userRepository = getRepository(User);
                const user = await userRepository.findOne({
                    where: { email },
                    withDeleted: true,
                });

                if (!user)
                    return reject({
                        status: 404,
                        message: 'Conta não encontrada!',
                    });

                const reset_token = crypt.generateHash();
                const expire_token = new Date();
                expire_token.setHours(new Date().getHours() + 1);

                const { id } = user;
                await userRepository.update(id, { reset_token, expire_token });

                resolve(reset_token);
            } catch (error) {}
        });
    },

    /**
     * Reset the password of an account
     * @param data
     * @param data.reset_token - The token to reset the password
     */
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
                        status: 404,
                        message: 'Usuário não encontrado!',
                    });

                if (new Date() > user.expire_token)
                    return reject({
                        status: 400,
                        message: 'Token expirado, peça outro!',
                    });

                await userRepository.update(user.id, {
                    password: crypt.encryptPassword(password),
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

    /**
     * Updates only `name` and `username`
     */
    update(
        id: string,
        data: { name: string; username: string },
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const { username } = data;

                const userRepository = getRepository(User);
                const [user, existsUsername] = await Promise.all([
                    userRepository.findOne(id),
                    userRepository.findOne({
                        where: { username, id: Not(id) },
                    }),
                ]);

                if (!user)
                    return reject({
                        status: 404,
                        message: 'Usuário não encontrado!',
                    });

                if (existsUsername)
                    return reject({ status: 400, message: 'Username em uso!' });

                await userRepository.update(id, data);

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
     * Updates only `email` validating the `password`
     */
    updateEmail(
        id: string,
        data: { email: string; password: string },
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const { email, password } = data;

                const userRepository = getRepository(User);
                const [user, existsEmail] = await Promise.all([
                    userRepository.findOne(id),
                    userRepository.findOne({ where: { id: Not(id), email } }),
                ]);

                if (!user)
                    return reject({
                        status: 404,
                        message: 'Usuário não encontrado!',
                    });

                if (existsEmail)
                    return reject({ status: 400, message: 'Email em uso!' });

                if (!crypt.comparePasswords(password, user.password))
                    return reject({ status: 401, message: 'Senha incorreta!' });

                await userRepository.update(id, { email });

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
     * Updates the user `picture`
     * @param id User ID
     * @returns Returns the picture url
     */
    updatePicture(id: string, picture: any): Promise<string | undefined> {
        return new Promise(async (resolve, reject) => {
            try {
                const userRepository = getRepository(User);
                const user = await userRepository.findOne(id);

                if (!user)
                    return reject({
                        status: 404,
                        message: 'Error inesperado! Tente novamente!',
                    });

                let location;
                if (picture) {
                    const [{ Location }] = await Promise.all([
                        upload.save(picture),
                        user.picture ? upload.remove(user.picture) : null,
                    ]);

                    location = Location;
                    await userRepository.update(id, { picture: Location });
                } else if (user.picture) {
                    await Promise.all([
                        upload.remove(user.picture),
                        userRepository.update(id, { picture: undefined }),
                    ]).catch(error =>
                        reject({
                            status: 500,
                            message: 'Não foi possível remover a imagem!',
                            error,
                        }),
                    );
                }

                resolve(location);
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
