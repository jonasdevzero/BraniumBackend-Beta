import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { getRepository } from 'typeorm';
import { constants } from '../../config/constants';
import { User } from '../models';
import { ws } from '../plugins/websocket';
import SocketUsers from './users';

export const wsUsers = new SocketUsers();

export async function socketConnection(
    socket: Socket,
    fastify: FastifyInstance,
) {
    try {
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

        socket.join(id);
        user.groups.forEach(gU => socket.join(gU.group_id));
        wsUsers.set(id, { socket, user });
        const contactsOnline = wsUsers.getContactsOnline(id);
        
        wsUsers.emitToContacts(
            id,
            'update',
            constants.socketActions.update('UPDATE_ROOM', {
                field: 'contacts',
                where: { id },
                set: { online: true },
            }),
        );

        socket.emit(
            'auth',
            null,
            constants.socketActions.update('SET_CONTACTS_ONLINE', {
                set: { contacts: contactsOnline },
            }),
        );
        socket.emit(
            'warn',
            constants.socketActions.warn('info', `Bem-vindo, ${user.username}`),
        );

        /* Event listeners */

        socket.on('is-online', (user: string | string[], callback) => {
            !Array.isArray(user) ? callback(!!wsUsers.get(user)) :
                callback(user.map(u => ({ id: u, online: !!wsUsers.get(u) })))
        });

        socket.on('disconnect', () => {
            wsUsers.emitToContacts(
                id,
                'update',
                constants.socketActions.update('UPDATE_ROOM', {
                    field: 'contacts',
                    where: { id },
                    set: { online: false },
                }),
            );
            wsUsers.remove(id);
        });
    } catch (error) {
        socket.emit('auth', error);
        socket.disconnect();
    }
}
