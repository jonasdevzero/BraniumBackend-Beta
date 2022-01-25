import * as yup from 'yup';
import { defaultError, defaultMessage } from '../default';

export default {
    show: {
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
                            last_message_time: { type: 'string' },
                            users: { type: 'array', items: {} },
                            messages: { type: 'array', items: {} },

                            role: { type: 'number' },
                            unread_messages: { type: 'number' },
                        },
                    },
                },
            },
            '4xx': defaultMessage,
            500: defaultError,
        },
    },

    create: {
        body: yup
            .object({
                name: yup.string().required('Campo "name" é obrigatório'),
                description: yup
                    .string()
                    .required('Campo "description" é obrigatório'),
                picture: yup.mixed(),
                members: yup.lazy((value: any) => {
                    return typeof value === 'string'
                        ? yup.string().uuid('Campo "members" inválido!')
                        : Array.isArray(value)
                        ? yup
                              .array()
                              .of(
                                  yup
                                      .string()
                                      .uuid('Campo "members" inválido!'),
                              )
                        : yup.string().nullable(true);
                }),
            })
            .required(),
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

                            role: { type: 'number' },
                            unread_messages: { type: 'number' },
                        },
                    },
                },
            },
            '4xx': defaultMessage,
            500: defaultError,
        },
    },

    update: {
        body: yup
            .object({
                name: yup.string().required('Campo "name" é obrigatório!'),
                description: yup
                    .string()
                    .required('Campo "name" é obrigatório!'),
            })
            .required(),
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
    },

    update_picture: {
        body: yup
            .object({
                picture: yup.mixed(),
            })
            .required(),
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
    },

    leave: {
        response: {
            200: defaultMessage,
            '4xx': defaultMessage,
            500: defaultError,
        },
    },

    deleteGroup: {
        response: {
            200: defaultMessage,
            '4xx': defaultMessage,
            500: defaultError,
        },
    },
};
