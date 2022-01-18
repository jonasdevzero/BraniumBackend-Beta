import * as yup from 'yup';
import { defaultError, defaultMessage } from '../default';

const message = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        text: { type: 'string' },
        sender_id: { type: 'string' },
        bidirectional_id: { type: 'string' },
        viewed: { type: 'boolean' },
        viewed_at: { type: 'string', nullable: true },
        created_at: { type: 'string' },
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
};

export default {
    index: {
        querystring: {
            type: 'object',
            properties: {
                limit: { type: 'number', nullable: true },
                skip: { type: 'number', nullable: true },
                skip_u: { type: 'number', nullable: true },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    messages: {
                        type: 'array',
                        items: message,
                    },
                },
            },
        },
    },

    create: {
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
                    message,
                },
            },
            '4xx': defaultError,
            500: defaultError,
        },
    },

    view: {
        response: {
            200: defaultMessage,
            '4xx': defaultError,
            500: defaultError,
        },
    },

    deleteOne: {
        querystring: yup
            .object({
                target: yup
                    .string()
                    .matches(
                        /^me$|^bidirectional$/,
                        'Query "target" inválido!',
                    ),
            })
            .required(),
        response: {
            200: defaultMessage,
            '4xx': defaultError,
            500: defaultError,
        },
    },

    clear: {
        response: {
            200: defaultMessage,
            '4xx': defaultError,
            500: defaultError,
        },
    },
};
