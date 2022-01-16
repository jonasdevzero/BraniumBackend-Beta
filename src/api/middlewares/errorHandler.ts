import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export default function errorHandler(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
) {
    let statusCode = error.statusCode || 500;
    let response;

    const { validation } = error;

    // check if we have a validation error
    if (validation) {
        statusCode = 400;
        response = {
            message: validation[0],
        };
    } else {
        response = {
            message: 'Internal Server Error',
            error,
        };
    }

    reply.status(statusCode).send(response);
}
