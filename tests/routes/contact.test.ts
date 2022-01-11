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

        const { user } = JSON.parse(res2.payload);
        user_0 = user;

        expect(res.statusCode).toEqual(200);
        expect(user_0.contacts[0].blocked).toBeTruthy();
    });
});
