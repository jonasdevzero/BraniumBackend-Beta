import * as yup from 'yup';
import { defaultError, defaultMessage } from '../default';

export default {
    index: {
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
    },

    add: {
        body: yup
            .object({
                group_id: yup
                    .string()
                    .required('Campo "group_id" é obrigatório!'),
                user_id: yup
                    .string()
                    .required('Campo "user_id" é obrigatório!'),
            })
            .required(),
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
    },

    role: {
        body: yup
            .object({
                group_id: yup.string().uuid().required(),
                member_id: yup.string().uuid().required(),
                role: yup
                    .number()
                    .oneOf([0, 1], 'Valor do campo "role" inválido!')
                    .typeError('Formato do campo "role" inválido!')
                    .required(),
            })
            .required(),
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
    },

    remove: {
        body: yup
            .object({
                group_id: yup.string().uuid().required(),
                member_id: yup.string().uuid().required(),
            })
            .required(),
        response: {
            200: defaultMessage,
            '4xx': defaultMessage,
            500: defaultError,
        },
    },
};
