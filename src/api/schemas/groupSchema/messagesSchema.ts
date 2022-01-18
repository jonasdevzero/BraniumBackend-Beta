import * as yup from 'yup';
import { defaultError, defaultMessage } from '../default';

const index = {
    response: {
        200: {
            type: 'object',
            properties: {
                messages: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            group_id: { type: 'string' },
                            sender_id: { type: 'string' },
                            text: { type: 'string' },
                            created_at: { type: 'string' },
                            sender: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    username: { type: 'string' },
                                    picture: { type: 'string', nullable: true },
                                },
                            },
                            medias: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        message_id: { type: 'string' },
                                        url: { type: 'string' },
                                        type: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const create = {
    body: yup
        .object({
            to: yup.string().required('Campo "to" é obrigatório!'),
            text: yup.string(),
            medias: yup.mixed(),
        })
        .required(),
    response: {
        201: {
            type: 'object',
            properties: {
                to: { type: 'string' },
                message: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        group_id: { type: 'string' },
                        sender_id: { type: 'string' },
                        text: { type: 'string' },
                        created_at: { type: 'string' },
                        sender: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                username: { type: 'string' },
                                picture: { type: 'string', nullable: true },
                            },
                        },
                        medias: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    message_id: { type: 'string' },
                                    url: { type: 'string' },
                                    type: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const view = {
    response: {
        200: defaultMessage,
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const deleteMessage = {
    response: {
        200: defaultMessage,
        '4xx': defaultMessage,
        500: defaultError,
    },
};

export default {
    index,
    create,
    view,
    deleteMessage,
};
