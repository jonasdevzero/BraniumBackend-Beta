import { getRepository } from 'typeorm';
import { ServerRequest, ServerReply } from '../interfaces/controller';
import { User, ContactInvitation, PreRegistration } from '../models';
import { crypt, upload, mailer } from '../helpers';
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

    async getPreRegistration(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.params.id;

            const pR = await getRepository(PreRegistration).findOne(id);

            if (!pR)
                return reply
                    .status(404)
                    .send({ message: 'Cadastro não encontrado!' });

            reply.status(200).send({ preRegistration: pR });
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
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async update(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString();

            await UserService.update(id, req.body);

            reply.status(200).send(req.body);
        } catch (error) {
            reply.status(500).send({ message: 'Internal Server Error', error });
        }
    },

    async email(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString();
            const { email } = req.body;

            await UserService.updateEmail(id, req.body);

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

            const location = await UserService.updatePicture(id, picture);

            reply.status(200).send({ location });
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

            const reset_token = crypt.generateHash();
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

            await UserService.validatePassword(id, password);

            await getRepository(User).softDelete(id);

            reply.status(200).send({ message: 'ok' });
        } catch (err: any) {
            const { status, message, error } = err;
            reply.status(status).send({ message, error });
        }
    },

    async restore(req: ServerRequest, reply: ServerReply) {
        try {
            const { email, password } = req.body;

            const userId = await UserService.validatePassword(
                email,
                password,
                true,
            );

            await getRepository(User).restore(userId);

            reply.status(200).send({ message: 'ok' });
        } catch (err: any) {
            const { status, message, error } = err;
            reply.status(status).send({ message, error });
        }
    },
};
