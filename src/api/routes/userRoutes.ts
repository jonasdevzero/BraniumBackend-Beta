import { FastifyPluginOptions, FastifyInstance } from 'fastify';
import userController from '../controllers/UserController';
import userSchema from '../schemas/userSchema';
import { serializeAuth } from '../views/UserView';
import { errorHandler, validatorCompiler, auth } from '../middlewares';

export default function userRoutes(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.get(
        '/',
        {
            schema: userSchema.index,
        },
        userController.index,
    );

    fastify.get(
        '/search',
        {
            schema: userSchema.search,
            preValidation: auth,
        },
        userController.search,
    );

    fastify.get(
        '/pre_registration/:id',
        {
            schema: userSchema.getPreRegistration,
        },
        userController.getPreRegistration,
    );

    fastify.post(
        '/pre_registration',
        {
            schema: userSchema.preRegistration,
            validatorCompiler,
            errorHandler,
        },
        userController.preRegistration,
    );

    fastify.post(
        '/registration/:id',
        {
            schema: userSchema.registration,
            validatorCompiler,
            errorHandler,
        },
        userController.registration,
    );

    fastify.post(
        '/login',
        {
            schema: userSchema.login,
            validatorCompiler,
            errorHandler,
        },
        userController.login,
    );

    fastify.post(
        '/auth',
        {
            schema: userSchema.auth,
            preValidation: auth,
            preSerialization: serializeAuth,
        },
        userController.auth,
    );

    fastify.put(
        '/',
        {
            schema: userSchema.update,
            preValidation: auth,
            validatorCompiler,
            errorHandler,
        },
        userController.update,
    );

    fastify.patch(
        '/email',
        {
            schema: userSchema.email,
            preValidation: auth,
            validatorCompiler,
            errorHandler,
        },
        userController.email,
    );

    fastify.patch(
        '/picture',
        {
            schema: userSchema.picture,
            preValidation: auth,
        },
        userController.picture,
    );

    fastify.post(
        '/forgot_password',
        {
            schema: userSchema.forgotPassword,
        },
        userController.forgotPassword,
    );

    fastify.patch(
        '/reset_password',
        {
            schema: userSchema.resetPassword,
            validatorCompiler,
            errorHandler,
        },
        userController.resetPassword,
    );

    fastify.post(
        '/delete',
        {
            schema: userSchema.delete,
            preValidation: auth,
        },
        userController.delete,
    );

    fastify.post(
        '/restore',
        {
            schema: userSchema.restore,
        },
        userController.restore,
    );

    done();
}
