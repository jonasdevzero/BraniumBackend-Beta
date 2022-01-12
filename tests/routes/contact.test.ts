import { build } from '../helper';
import { getRepository } from 'typeorm';
import FormData from 'form-data';
import { PreRegistration, User } from '../../src/api/models';

const users = [
    {
        name: 'test0',
        username: 'devzerotest',
        email: 'devzerotest@dev.com',
        jwt: '',
    },
    {
        name: 'test1',
        username: 'devonetest',
        email: 'devonetest@dev.com',
        jwt: '',
    },
];

describe('contact routes tests', () => {
    const app = build();
    let user_0: User, user_1: User;

    test('POST /contact/invite/:id', async () => {
        /* ------------------- create two new accounts for tests --------------------- */
        await Promise.all(
            users.map(u =>
                app.inject({
                    method: 'POST',
                    url: '/user/pre_registration',
                    payload: {
                        name: u.name,
                        email: u.email,
                    },
                }),
            ),
        );
        const registrations = await getRepository(PreRegistration).find({
            where: { pending: true },
        });
        await Promise.all(
            users.map(async (u, index) => {
                const registration = registrations.find(
                    r => r.email === u.email,
                );

                const res = await app.inject({
                    method: 'POST',
                    url: `/user/registration/${registration?.id}`,
                    payload: {
                        username: u.username,
                        password: '123456',
                        confirm_password: '123456',
                    },
                });

                const { token } = JSON.parse(res.payload);
                users[index].jwt = `Bearer ${token}`;
            }),
        );
        await Promise.all(
            users.map(async (u, index) => {
                const res = await app.inject({
                    method: 'POST',
                    url: '/user/auth',
                    headers: {
                        authorization: u.jwt,
                    },
                });

                const { user } = JSON.parse(res.payload);
                index === 0 ? (user_0 = user) : (user_1 = user);
            }),
        );
        /* ------------------- end to create two new accounts --------------------------- */

        // user_0 inviting user_1
        const res = await app.inject({
            method: 'POST',
            url: `/contact/invite/${user_1.id}`,
            headers: {
                authorization: users[0].jwt,
            },
        });

        expect(res.statusCode).toEqual(201);
    });

    test('POST /contact/refuse/:invite', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/auth',
            headers: {
                authorization: users[1].jwt,
            },
        });
        const { user } = JSON.parse(res.payload);
        user_1 = user;

        const invitation_id = user_1.contact_invitations[0].id;

        const res2 = await app.inject({
            method: 'POST',
            url: `/contact/invite/refuse/${invitation_id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        expect(res2.statusCode).toEqual(200);
    });

    test('POST /contact/accept/:invite', async () => {
        // resending a new invite
        await app.inject({
            method: 'POST',
            url: `/contact/invite/${user_1.id}`,
            headers: {
                authorization: users[0].jwt,
            },
        });

        const res = await app.inject({
            method: 'POST',
            url: '/user/auth',
            headers: {
                authorization: users[1].jwt,
            },
        });
        const { user } = JSON.parse(res.payload);
        user_1 = user;

        const invitation_id = user_1.contact_invitations[0].id;

        const res2 = await app.inject({
            method: 'POST',
            url: `/contact/invite/accept/${invitation_id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        const { contact } = JSON.parse(res2.payload);
        const { username } = contact;

        expect(username).toEqual(users[0].username);
        expect(res2.statusCode).toEqual(201);
    });

    test('GET /contact/:id', async () => {
        const res = await app.inject({
            method: 'GET',
            url: `/contact/${user_1.id}`,
            headers: {
                authorization: users[0].jwt,
            },
        });

        const { contact } = JSON.parse(res.payload);
        const { username } = contact;

        expect(username).toEqual(users[1].username);
        expect(res.statusCode).toEqual(200);
    });

    test('PATCH /contact/block', async () => {
        // user_1 blocking user_0
        const res = await app.inject({
            method: 'PATCH',
            url: `/contact/block/${user_0.id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        const res2 = await app.inject({
            method: 'POST',
            url: '/user/auth',
            headers: {
                authorization: users[0].jwt,
            },
        });
        const res3 = await app.inject({
            method: 'POST',
            url: '/user/auth',
            headers: {
                authorization: users[1].jwt,
            },
        });

        user_0 = JSON.parse(res2.payload).user;
        user_1 = JSON.parse(res3.payload).user;

        expect(res.statusCode).toEqual(200);
        expect(user_0.contacts[0].blocked).toBeTruthy();
        expect(user_1.contacts[0].you_blocked).toBeTruthy();
    });

    // ------------- testing contact messages routes -------------

    test('POST /contact/messages', async () => {
        // unblock contact from the last test
        await app.inject({
            method: 'PATCH',
            url: `/contact/block/${user_0.id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        const form = new FormData();
        form.append('to', user_1.id);
        form.append('text', 'testing create message');

        // user_0 sending a message to user_1
        const res = await app.inject({
            method: 'POST',
            url: '/contact/messages',
            payload: form,
            headers: {
                ...form.getHeaders(),
                authorization: users[0].jwt,
            },
        });

        expect(res.statusCode).toEqual(201);
    });

    test('GET /contact/messages/:contact', async () => {
        const res = await app.inject({
            method: 'GET',
            url: `/contact/messages/${user_0.id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        const { messages } = JSON.parse(res.payload);
        const { sender_id, text } = messages[0];

        expect({ sender_id, text }).toEqual({
            sender_id: user_0.id,
            text: 'testing create message',
        });
    });

    test('PATCH /contact/messages/view/:contact', async () => {
        const res = await app.inject({
            method: 'GET',
            url: `/contact/messages/${user_0.id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        const beforeMessage = JSON.parse(res.payload).messages[0];

        // user_1 viewing the message from user_0
        await app.inject({
            method: 'PATCH',
            url: `/contact/messages/view/${user_0.id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        const res2 = await app.inject({
            method: 'GET',
            url: `/contact/messages/${user_0.id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        const afterMessage = JSON.parse(res2.payload).messages[0];

        expect(beforeMessage.viewed).toStrictEqual(false);
        expect(afterMessage.viewed).toStrictEqual(true);
    });

    test('DELETE /contact/messages/:message', async () => {
        const res = await app.inject({
            method: 'GET',
            url: `/contact/messages/${user_1.id}`,
            headers: {
                authorization: users[0].jwt,
            },
        });

        const message_id = JSON.parse(res.payload).messages[0].id;

        await app.inject({
            method: 'DELETE',
            url: `/contact/messages/${message_id}`,
            headers: {
                authorization: users[0].jwt,
            },
        });

        const res2 = await app.inject({
            method: 'GET',
            url: `/contact/messages/${user_1.id}`,
            headers: {
                authorization: users[0].jwt,
            },
        });
        const res3 = await app.inject({
            method: 'GET',
            url: `/contact/messages/${user_0.id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        const user_0_messages = JSON.parse(res2.payload).messages;
        const user_1_messages = JSON.parse(res3.payload).messages;

        expect(user_0_messages.length).toEqual(0);
        expect(user_1_messages.length).toEqual(1);
    });

    test('DELETE /contact/messages/clear/:contact', async () => {
        const form = new FormData();
        form.append('to', user_1.id);
        form.append('text', `create message 2`);
        // user_0 sending a message to user_1
        await app.inject({
            method: 'POST',
            url: '/contact/messages',
            payload: form,
            headers: {
                ...form.getHeaders(),
                authorization: users[0].jwt,
            },
        });

        // clearing messages that user_0 sent
        await app.inject({
            method: 'DELETE',
            url: `/contact/messages/clear/${user_1.id}`,
            headers: {
                authorization: users[0].jwt,
            },
        });

        const res = await app.inject({
            method: 'GET',
            url: `/contact/messages/${user_1.id}`,
            headers: {
                authorization: users[0].jwt,
            },
        });
        const res2 = await app.inject({
            method: 'GET',
            url: `/contact/messages/${user_0.id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        const user_0_messages = JSON.parse(res.payload).messages;
        const user_1_messages = JSON.parse(res2.payload).messages;

        expect(user_0_messages.length).toEqual(0);
        expect(user_1_messages.length).toEqual(2);
    });

    test('DELETE /contact/messages/:message?target=bidirectional', async () => {
        const form = new FormData();
        form.append('to', user_1.id);
        form.append('text', `create message 2`);
        // user_0 sending a message to user_1
        const res = await app.inject({
            method: 'POST',
            url: '/contact/messages',
            payload: form,
            headers: {
                ...form.getHeaders(),
                authorization: users[0].jwt,
            },
        });

        const message_id = JSON.parse(res.payload).message.id;

        await app.inject({
            method: 'DELETE',
            url: `/contact/messages/${message_id}?target=bidirectional`,
            headers: {
                authorization: users[0].jwt,
            },
        });

        const res2 = await app.inject({
            method: 'GET',
            url: `/contact/messages/${user_1.id}`,
            headers: {
                authorization: users[0].jwt,
            },
        });
        const res3 = await app.inject({
            method: 'GET',
            url: `/contact/messages/${user_0.id}`,
            headers: {
                authorization: users[1].jwt,
            },
        });

        const user_0_messages = JSON.parse(res2.payload).messages;
        const user_1_messages = JSON.parse(res3.payload).messages;

        expect(user_0_messages.length).toEqual(0);
        expect(user_1_messages.length).toEqual(2);
    });
});
