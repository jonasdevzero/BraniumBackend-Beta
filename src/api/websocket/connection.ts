import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { getRepository } from 'typeorm';
import { constants } from '../../config/constants';
import { User } from '../models';
import WsUsersController from '../controllers/WsUsersController';

const clientActions = constants.client.actions;

export const wsUsersController = new WsUsersController();

export async function socketConnection(
    socket: Socket,
    fastify: FastifyInstance,
) {
    try {
        /* ---------- User Auth ---------- */
        const jwt = socket.handshake.query.jwt as string;

        if (!jwt) {
            socket.emit('auth', 'Não autorizado!');
            return socket.disconnect();
        }

        const token = jwt.split(' ')[1];

        const id: string = await new Promise((resolve, reject) => {
            fastify.jwt.verify(token, (err: any, decoded: any) => {
                return !err ? resolve(decoded.id) : reject(err);
            });
        });

        const userRepository = getRepository(User);
        const user = await userRepository.findOne(id, {
            relations: ['contacts', 'groups'],
        });

        if (!user) {
            socket.emit('auth', 'Usuário não encontrado');
            return socket.disconnect();
        }
        /* ---------- Ending User Auth ---------- */

        const contacts = user.contacts.map(c => c.contact_user_id);
        const groups = user.groups.map(g => g.group_id);

        socket.join(id);
        groups.forEach(g => socket.join(g));

        wsUsersController
            .set(id, {
                socketId: socket.id,
                contacts,
                groups,
            })
            .broadcastToContacts(id, 'update', {
                type: clientActions.UPDATE_ROOM,
                field: 'contacts',
                where: { id },
                set: { online: true },
            })
            .broadcastToGroups(id, 'update', {
                type: clientActions.UPDATE_GROUP_USER,
                where: { member_id: id },
                set: { online: true },
            });

        socket.emit('auth', null);
        socket.emit('update', {
            type: clientActions.SET_CONTACTS_ONLINE,
            set: { contacts: wsUsersController.getContactsOnline(id) },
        });
        socket.emit('warn', {
            type: 'info',
            message: `Bem-vindo, ${user.username}`,
        });

        /* ---------- Event listeners ---------- */

        socket.on('is-online', (user: string | string[], callback) => {
            !Array.isArray(user)
                ? callback(wsUsersController.isOnline(user))
                : callback(
                      user.map(u => ({
                          id: u,
                          online: wsUsersController.isOnline(u),
                      })),
                  );
        });

        socket.on('disconnect', () => {
            wsUsersController.remove(id);
        });
    } catch (error) {
        console.error('error', error);
        socket.emit('auth', error);
        socket.disconnect();
    }
}
