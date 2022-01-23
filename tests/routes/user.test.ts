import { build } from '../helper';
import { getRepository } from 'typeorm';
import FormData from 'form-data';
import * as fs from 'fs';
import { PreRegistration, User } from '../../src/api/models';
import { upload } from '../../src/api/helpers';

describe('user routes tests', () => {
    const app = build();
    let pre_registration = '';
    let jwt = '';
    let user_id = '';
    let picture_url = '';

    test('index route test', async () => {
        const res = await app.inject({
            url: '/user',
        });

        expect(JSON.parse(res.payload)).toEqual({ users: [] });
    });

    test('preRegistration route test', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/pre_registration',
            payload: {
                name: 'test',
                email: 'devtest@test.com',
            },
        });

        expect(res.statusCode).toEqual(201);
    });

    test('get preRegistration route test', async () => {
        const [registration] = await getRepository(PreRegistration).find({
            select: ['id'],
        });
        pre_registration = registration.id;

        const res = await app.inject({
            method: 'GET',
            url: `/user/pre_registration/${pre_registration}`,
        });

        expect(JSON.parse(res.payload)).toEqual({
            preRegistration: { name: 'test', pending: true },
        });
    });

    test('registration route test', async () => {
        const res = await app.inject({
            method: 'POST',
            url: `/user/registration/${pre_registration}`,
            payload: {
                username: 'devtest',
                password: '123456',
                confirm_password: '123456',
            },
        });

        expect(res.statusCode).toEqual(201);
    });

    test('login route test', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/login',
            payload: {
                login: 'devtest',
                password: '123456',
            },
        });

        const { token } = JSON.parse(res.payload);
        jwt = `Bearer ${token}`;

        expect(res.statusCode).toEqual(200);
    });

    test('auth route test', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/auth',
            headers: {
                authorization: jwt,
            },
        });

        const { user } = JSON.parse(res.payload);
        const { id, name, username, email } = user;
        user_id = id;

        expect(res.statusCode).toEqual(200);
        expect({
            name: 'test',
            username: 'devtest',
            email: 'devtest@test.com',
        }).toEqual({ name, username, email });
    });

    test('update route test', async () => {
        const res = await app.inject({
            method: 'PUT',
            url: '/user',
            payload: {
                name: 'test',
                username: 'dev_test',
            },
            headers: {
                authorization: jwt,
            },
        });

        expect(JSON.parse(res.payload)).toEqual({
            name: 'test',
            username: 'dev_test',
        });
    });

    test('update email route test', async () => {
        const res = await app.inject({
            method: 'PATCH',
            url: '/user/email',
            payload: {
                email: 'devtestzero@dev.com', // the new password
                password: '123456', // the current password
            },
            headers: {
                authorization: jwt,
            },
        });

        expect(JSON.parse(res.payload)).toEqual({
            email: 'devtestzero@dev.com',
        });
    });

    test('update picture route test', async () => {
        const form = new FormData();
        form.append(
            'picture',
            fs.createReadStream('./tests/assets/picture.jpg'),
        );

        const res = await app.inject({
            method: 'PATCH',
            url: '/user/picture',
            payload: form,
            headers: {
                ...form.getHeaders(),
                authorization: jwt,
            },
        });

        picture_url = JSON.parse(res.payload)?.picture_url;

        expect(res.statusCode).toEqual(200);
    });

    test('forgot password route test', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/forgot_password',
            payload: {
                email: 'devtestzero@dev.com',
            },
        });

        expect(res.statusCode).toEqual(200);
    });

    test('reset password route test', async () => {
        const [{ reset_token }] = await getRepository(User).find({
            select: ['reset_token'],
        });

        const res = await app.inject({
            method: 'PATCH',
            url: '/user/reset_password',
            payload: {
                reset_token,
                password: '654321',
                confirm_password: '654321',
            },
        });

        expect(res.statusCode).toEqual(200);
    });

    test('delete user route test', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/delete',
            payload: {
                password: '654321',
            },
            headers: {
                authorization: jwt,
            },
        });
        const users = await getRepository(User).find();

        expect(res.statusCode).toEqual(200);
        expect(users.length).toEqual(0);
    });

    test('restore user route test', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/restore',
            payload: {
                email: 'devtestzero@dev.com',
                password: '654321',
            },
        });
        const users = await getRepository(User).find();

        expect(res.statusCode).toEqual(200);
        expect(users.length).toEqual(1);
    });

    test('search route test', async () => {
        // pre register a new user
        await app.inject({
            method: 'POST',
            url: '/user/pre_registration',
            payload: {
                name: 'test2',
                email: 'devtest2@test.com',
            },
        });
        const [registration] = await getRepository(PreRegistration).find({
            where: { pending: true },
        });

        // register a new user
        const res = await app.inject({
            method: 'POST',
            url: `/user/registration/${registration.id}`,
            payload: {
                username: 'devtest2',
                password: '123456',
                confirm_password: '123456',
            },
        });

        const { token } = JSON.parse(res.payload);

        // searching as a new user
        const res2 = await app.inject({
            url: '/user/search?username=dev_',
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        const { users } = JSON.parse(res2.payload);
        const [{ id, username }] = users;

        expect({ id, username }).toEqual({
            id: user_id,
            username: 'dev_test',
        });

        // deleting the picture...
        upload.remove(picture_url);
    });
});
