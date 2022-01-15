import { defaultError, defaultMessage } from '../default';

const index = {
    response: {
        200: {
            type: 'object',
            properties: {
                users: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            username: { type: 'string' },
                            picture: { type: 'string', nullable: true },
                            role: { type: 'number' },
                        },
                    },
                },
            },
        },
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const add = {
    response: {
        201: {
            type: 'object',
            properties: {
                member: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        username: { type: 'string' },
                        picture: { type: 'string', nullable: true },
                        role: { type: 'number' },
                    },
                },
            },
        },
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const role = {
    response: {
        200: {
            type: 'object',
            properties: {
                role: { type: 'number' },
            },
        },
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const remove = {
    response: {
        200: defaultMessage,
        '4xx': defaultMessage,
        500: defaultError,
    },
};

export default {
    index,
    add,
    role,
    remove,
};
