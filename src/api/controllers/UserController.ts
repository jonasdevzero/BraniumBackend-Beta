import { getRepository, ILike, Not } from 'typeorm';
import { ServerRequest, ServerReply } from '../interfaces/controller';
import { User, ContactInvitation, PreRegistration } from '../models';
import { userUtil, upload } from '../helpers';
import * as yup from 'yup';
import mailer from '../helpers/mailer';
import { constants } from '../../config/constants';
import UserService from '../services/UserService';

export default {
    async index(req: ServerRequest, reply: ServerReply) {
        try {
            let { take, page } = req.query;

            take = take > 0 ? take : 20;
            page = (page > 0 ? page : 0) * take;

            const userRepository = getRepository(User);
            const users = await userRepository.find({
                take,
                skip: page,
                order: { created_at: 'DESC' },
            });

            reply.status(200).send({ users });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async search(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString();
            const { username } = req.query;

            const users = await UserService.search(id, username);

            reply.status(200).send({ users });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async preRegistration(req: ServerRequest, reply: ServerReply) {
        try {
            const { name, email } = req.body;

            // pre registration ID
            const id = await UserService.preRegister(req.body);

            mailer.sendTemplatedEmail({
                to: email,
                subject: 'Completar Cadastro',
                templateName: 'completeRegistration',
                data: {
                    name,
                    link: constants.client.routes.completeRegistration(id),
                },
            });

            reply.status(201).send({ message: 'Verifique seu e-mail!' });
        } catch (err: any) {
            const { status, message, error } = err;
            reply.status(status).send({ message, error });
        }
    },

    async showPreRegistration(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.params.id;

            const preRegistrationRepo = getRepository(PreRegistration);
            const preRegistration = await preRegistrationRepo.findOne(id);

            if (!preRegistration)
                return reply
                    .status(404)
                    .send({ message: 'Cadastro não encontrado!' });

            reply.status(200).send({ preRegistration });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async registration(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.params.id;

            const userId = await UserService.register(id, req.body);

            const token = await reply.jwtSign(
                { id: userId },
                { expiresIn: '24h' },
            );

            reply.status(201).send({ token });
        } catch (err: any) {
            const { status, message, error } = err;
            reply.status(status).send({ message, error });
        }
    },

    async login(req: ServerRequest, reply: ServerReply) {
        try {
            const { login, password } = req.body;

            const userId = await UserService.validatePassword(login, password);

            const token = await reply.jwtSign(
                { id: userId },
                { expiresIn: '24h' },
            );

            reply.status(200).send({ token });
        } catch (err: any) {
            const { status, message, error } = err;
            reply.status(status).send({ message, error });
        }
    },

    async auth(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString();

            const userRepository = getRepository(User);
            const user = await userRepository
                .createQueryBuilder('user')
                .where('user.id = :id', { id })
                .leftJoinAndSelect('user.contacts', 'contacts')
                .leftJoinAndSelect('contacts.contact', 'contact')
                .orderBy('contacts.last_message_time', 'DESC')
                .leftJoinAndMapMany(
                    'user.contact_invitations',
                    ContactInvitation,
                    'c_invitation',
                    'c_invitation.receiver_id = :receiver AND c_invitation.pending = TRUE',
                    { receiver: id },
                )
                .leftJoinAndSelect('c_invitation.sender', 'invitation_sender')
                .leftJoinAndSelect('user.groups', 'groups')
                .leftJoinAndSelect('groups.group', 'group')
                .withDeleted()
                .getOne();

            if (user?.deleted_at)
                return reply
                    .status(400)
                    .send({ message: 'Sua conta foi deletada! Restaure-a!' });

            reply.status(200).send({ user });
        } catch (error) {
            req.log.error(error);
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async update(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString();
            const { name, username } = req.body;

            const userRepository = getRepository(User);

            const [user, existsUsername] = await Promise.all([
                userRepository.findOne(id),
                userRepository.findOne({ where: { username, id: Not(id) } }),
            ]);

            if (!user)
                return reply
                    .status(500)
                    .send({ message: 'Usuário não encontrado!' });

            if (existsUsername)
                return reply.status(400).send({ message: 'Username em uso!' });

            await userRepository.update(id, { name, username });
            reply.status(200).send({ name, username });

            // Implemet Socket Event Bellow
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async email(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString();
            const { email, password } = req.body;

            const userRepository = getRepository(User);
            const [user, existsEmail] = await Promise.all([
                userRepository.findOne(id),
                userRepository.findOne({ where: { id: Not(id), email } }),
            ]);

            if (!user)
                return reply
                    .status(500)
                    .send({ message: 'Usuário não encontrado!' });

            if (existsEmail)
                return reply.status(400).send({ message: 'Email em uso!' });

            if (!userUtil.comparePasswords(password, user.password))
                return reply.status(401).send({ message: 'Senha incorreta!' });

            await userRepository.update(id, { email });

            reply.status(200).send({ email });
        } catch (err: any) {
            const { status, message, error } = err;
            reply.status(status).send({ message, error });
        }
    },

    async picture(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString();
            const { picture } = upload.parseBody(req.body);

            const userRepository = getRepository(User);
            const user = await userRepository.findOne(id);

            if (!user)
                return reply
                    .status(500)
                    .send({ message: 'Error inesperado! Tente novamente' });

            let location = null;
            if (picture) {
                const [{ Location }] = await Promise.all([
                    upload.save(picture),
                    user.picture ? upload.remove(user.picture) : null,
                ]).catch(error =>
                    reply.status(500).send({
                        message: 'Não foi possível atualizar a imagem!',
                        error,
                    }),
                );

                location = Location;
                await userRepository.update(id, { picture: Location });
            } else if (user.picture) {
                await Promise.all([
                    upload.remove(user.picture),
                    userRepository.update(id, { picture: undefined }),
                ]).catch(() =>
                    reply.status(500).send({
                        message: 'Não foi possível remover a imagem!',
                    }),
                );
            }

            reply.status(200).send({ location });

            // Implemet Socket Event Bellow
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async forgotPassword(req: ServerRequest, reply: ServerReply) {
        try {
            const { email } = req.body;

            const userRepository = getRepository(User);
            const user = await userRepository.findOne({
                where: { email },
                withDeleted: true,
            });

            if (!user)
                return reply
                    .status(400)
                    .send({ message: 'Conta não encontrada!' });

            const reset_token = userUtil.generateHash();
            const expire_token = new Date();
            expire_token.setHours(new Date().getHours() + 1);

            const { id } = user;
            await userRepository.update(id, { reset_token, expire_token });

            mailer.sendTemplatedEmail({
                to: email,
                subject: 'Resetar senha',
                templateName: 'forgotPassword',
                data: {
                    link: constants.client.routes.forgotPassword(reset_token),
                },
            });

            reply.status(200).send({ message: 'Verifique seu email' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async resetPassword(req: ServerRequest, reply: ServerReply) {
        try {
            await UserService.resetPassword(req.body);

            reply.status(200).send({ message: 'Senha alterada com sucesso!' });
        } catch (err: any) {
            const { status, message, error } = err;
            reply.status(status).send({ message, error });
        }
    },

    async delete(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString();
            const { password } = req.body;

            const userRepository = getRepository(User);
            const user = await userRepository.findOne(id, {
                withDeleted: true,
            });

            if (!user)
                return reply
                    .status(500)
                    .send({ message: 'Usuário não encontrado!' });

            if (user.deleted_at)
                return reply
                    .status(400)
                    .send({ message: 'Conta já deletada!' });

            if (!userUtil.comparePasswords(password, user.password))
                return reply.status(401).send({ message: 'Senha Incorreta' });

            await userRepository.softDelete(user);

            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async restore(req: ServerRequest, reply: ServerReply) {
        try {
            const { email, password } = req.body;

            const userRepository = getRepository(User);
            const user = await userRepository.findOne({
                where: { email },
                withDeleted: true,
            });

            if (!user)
                return reply
                    .status(404)
                    .send({ message: 'Usuário não encontrado!' });

            if (!user.deleted_at)
                return reply
                    .status(400)
                    .send({ message: 'Conta não deletada!' });

            if (!userUtil.comparePasswords(password, user.password))
                return reply.status(401).send({ message: 'Senha Incorreta!' });

            await userRepository.restore(user.id);
            reply.status(200).send({ message: 'ok' });
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },
};
