import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { getRepository } from 'typeorm';
import { constants } from '../../config/constants';
import { User } from '../models';
import WsUsersController from '../controllers/WsUsersController';
import { randomUUID } from 'crypto';

const clientActions = constants.client.actions;

export const wsUsersController = new WsUsersController();

const callRooms = {} as {
    [key: string]: Array<string>;
};

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
            .broadcastToGroups(id, 'update', group_id => ({
                type: clientActions.UPDATE_GROUP_USER,
                where: { id: group_id, member_id: id },
                set: { online: true },
            }));

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

        socket.on('get-id', (cb: Function) => cb(socket.id));

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

        socket.on('call:create', ({ to, callMedia }, callback: Function) => {
            const callId = randomUUID();
            callRooms[callId] = [id];

            const toArr = Array.isArray(to) ? to : [to];
            for (let i = 0; i < toArr.length; i++) {
                globalThis.ws.to(toArr[i]).emit('update', {
                    type: 'CALL_REQUEST',
                    callId,
                    callMedia,
                    callerId: id,
                });
            }

            callback(callId);
        });

        socket.on('call:join', (callId: string) => {
            callRooms[callId].push(id);
            const users = callRooms[callId].filter(cId => cId !== id);
            socket.emit('call:users', users);
        });

        socket.on('call:signal', ({ userToSignal, callerId, signal }) => {
            globalThis.ws
                .to(userToSignal)
                .emit('call:user-join', { signal, callerId });
        });

        socket.on('call:answer-signal', ({ signal, callerId }) => {
            globalThis.ws
                .to(callerId)
                .emit('call:returned-signal', { signal, id });
        });

        socket.on("call:reject", ({ callerId }) => {
            globalThis.ws.to(callerId).emit("call:rejected", id)
        })

        socket.on('call:leave', (callId: string) => {
            const users = callRooms[callId]?.filter(u => u !== id) || [];

            users.forEach(u => globalThis.ws.to(u).emit('call:user-leave', id));

            if (users.length < 2) {
                globalThis.ws.to(users[0]).emit('call:end')
                delete callRooms[callId]
            } else callRooms[callId] = users;
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
