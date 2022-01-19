import { getRepository } from 'typeorm';
import { ServerRequest, ServerReply } from '../interfaces/controller';
import { User, ContactInvitation, PreRegistration } from '../models';
import { mailer, parseBody } from '../helpers';
import { constants } from '../../config/constants';
import UserService from '../services/UserService';
import WebSocketService from '../services/WebSocketService';

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
        } catch (error: any) {
            reply.status(error.status).send(error);
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
        } catch (error: any) {
            reply.status(error.status).send(error);
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
        } catch (error: any) {
            reply.status(error.status).send(error);
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
        } catch (error: any) {
            reply.status(error.status).send(error);
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
            const id = req.user as string;
            const data = req.body;

            await UserService.update(id, data);
            WebSocketService.user.update(id, data)

            reply.status(200).send(req.body);
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },

    async email(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString();
            const { email } = req.body;

            await UserService.updateEmail(id, req.body);

            reply.status(200).send({ email });
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },

    async picture(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user as string;
            const { picture } = parseBody(req.body);

            const picture_url = await UserService.updatePicture(id, picture);
            WebSocketService.user.update(id, { picture: picture_url })

            reply.status(200).send({ picture_url });
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },

    async forgotPassword(req: ServerRequest, reply: ServerReply) {
        try {
            const { email } = req.body;

            const reset_token = await UserService.createResetToken(email);

            mailer.sendTemplatedEmail({
                to: email,
                subject: 'Resetar senha',
                templateName: 'forgotPassword',
                data: {
                    link: constants.client.routes.forgotPassword(reset_token),
                },
            });

            reply.status(200).send({ message: 'Verifique seu email' });
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },

    async resetPassword(req: ServerRequest, reply: ServerReply) {
        try {
            await UserService.resetPassword(req.body);

            reply.status(200).send({ message: 'Senha alterada com sucesso!' });
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },

    async delete(req: ServerRequest, reply: ServerReply) {
        try {
            const id = req.user.toString();
            const { password } = req.body;

            await UserService.validatePassword(id, password);

            await getRepository(User).softDelete(id);

            reply.status(200).send({ message: 'ok' });
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },

    async restore(req: ServerRequest, reply: ServerReply) {
        try {
            const { email, password } = req.body;

            // Validates the password of an deleted account
            const userId = await UserService.validatePassword(
                email,
                password,
                true,
            );

            await getRepository(User).restore(userId);

            reply.status(200).send({ message: 'ok' });
        } catch (error: any) {
            reply.status(error.status).send(error);
        }
    },
};
