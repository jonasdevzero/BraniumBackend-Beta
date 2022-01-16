import { defaultError, defaultMessage } from '../default';

const show = {
    response: {
        200: {
            type: 'object',
            properties: {
                group: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        picture: { type: 'string', nullable: true },
                        description: { type: 'string' },
                        created_at: { type: 'string' },
                        leader_id: { type: 'string' },
                        users: { type: 'array', items: {} },
                        messages: { type: 'array', items: {} },
                    },
                },
            },
        },
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const create = {
    response: {
        201: {
            type: 'object',
            properties: {
                group: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        picture: { type: 'string', nullable: true },
                        description: { type: 'string' },
                        created_at: { type: 'string' },
                        leader_id: { type: 'string' },
                        users: { type: 'array', items: {} },
                        messages: { type: 'array', items: {} },
                    },
                },
            },
        },
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const update = {
    response: {
        200: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
            },
        },
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const update_picture = {
    response: {
        200: {
            type: 'object',
            properties: {
                picture: { type: 'string' },
            },
        },
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const leave = {
    response: {
        200: defaultMessage,
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const deleteGroup = {
    response: {
        200: defaultMessage,
        '4xx': defaultMessage,
        500: defaultError,
    },
};

export default {
    show,
    create,
    update,
    update_picture,
    leave,
    deleteGroup,
};
