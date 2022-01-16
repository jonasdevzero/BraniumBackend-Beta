import * as yup from 'yup';
import { defaultMessage, defaultError } from './default';

const userAuth = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        username: { type: 'string' },
        email: { type: 'string' },
        picture: { type: 'string', nullable: true },
        contact_invitations: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    sender: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            username: { type: 'string' },
                            picture: {
                                type: 'string',
                                nullable: true,
                            },
                        },
                    },
                    sender_id: { type: 'string' },
                    receiver_id: { type: 'string' },
                    created_at: { type: 'string' },
                },
            },
        },
        contacts: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    picture: {
                        type: 'string',
                        nullable: true,
                    },
                    messages: { type: 'array', items: {} },
                    unread_messages: { type: 'number' },
                    last_message_time: { type: 'string' },
                    blocked: { type: 'boolean' },
                    you_blocked: { type: 'boolean' },
                },
            },
        },
        groups: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    picture: {
                        type: 'string',
                        nullable: true,
                    },
                    description: { type: 'string' },
                    created_at: { type: 'string' },
                    leader_id: { type: 'string' },
                    role: { type: 'number' },
                    unread_messages: { type: 'number' },
                    messages: { type: 'array', items: {} },
                    users: {
                        type: 'array',
                        items: {},
                    },
                },
            },
        },
    },
};

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
                            },
                        },
                    },
                },
            },
        },
    },

    search: {
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
                            },
                        },
                    },
                },
            },
            400: defaultMessage,
            500: defaultError,
        },
    },

    getPreRegistration: {
        response: {
            200: {
                type: 'object',
                properties: {
                    preRegistration: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            pending: { type: 'boolean' },
                        },
                    },
                },
            },
        },
    },

    preRegistration: {
        body: yup
            .object({
                name: yup.string().required('Preencha o campo nome'),
                email: yup
                    .string()
                    .lowercase()
                    .email('Formatação de email incorreta')
                    .required('Preencha o campo "email"'),
            })
            .required(),
        response: {
            201: defaultMessage,
            400: defaultMessage,
            500: defaultError,
        },
    },

    registration: {
        body: yup
            .object({
                username: yup
                    .string()
                    .min(4, 'O "username" deve ter no mínimo 4 caracteres!')
                    .required(),
                password: yup
                    .string()
                    .min(6, 'A senha deve ter no mínimo 6 caracteres')
                    .required('Preencha o campo "senha"'),
                confirm_password: yup
                    .string()
                    .oneOf([yup.ref('password'), null], 'Senhas diferentes!')
                    .required('Preencha o campo "confirmar senha"'),
            })
            .required(),
        response: {
            201: {
                type: 'object',
                properties: {
                    token: { type: 'string' },
                },
            },
            400: defaultMessage,
            500: defaultError,
        },
    },

    login: {
        body: yup
            .object({
                login: yup
                    .string()
                    .required('Preencha o campo de "Username / email"'),
                password: yup.string().required('Preencha o campo "senha"'),
            })
            .required(),
        response: {
            200: {
                type: 'object',
                properties: {
                    token: { type: 'string' },
                },
            },
            '4xx': defaultMessage,
            500: defaultError,
        },
    },

    auth: {
        response: {
            200: {
                type: 'object',
                properties: {
                    user: userAuth,
                },
            },
            400: defaultMessage,
            500: defaultError,
        },
    },

    update: {
        body: yup
            .object({
                name: yup.string().required('Preencha o campo "nome"'),
                username: yup
                    .string()
                    .min(4, 'O "username" deve ter no mínimo 4 caracteres!')
                    .required(),
            })
            .required(),
        response: {
            200: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    username: { type: 'string' },
                },
            },
            400: defaultMessage,
            500: defaultError,
        },
    },

    email: {
        body: yup
            .object({
                email: yup
                    .string()
                    .email('Email mal formatado')
                    .required('Preencha o campo "email"'),
                password: yup.string().required('Preencha o campo "senha"'),
            })
            .required(),
        response: {
            200: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                },
            },
            '4xx': defaultMessage,
            500: defaultError,
        },
    },

    picture: {
        response: {
            200: {
                type: 'object',
                properties: {
                    location: { type: 'string', nullable: true },
                },
            },
            '4xx': defaultMessage,
            500: defaultError,
        },
    },

    forgotPassword: {
        response: {
            200: defaultMessage,
            400: defaultMessage,
            500: defaultError,
        },
    },

    resetPassword: {
        body: yup
            .object({
                reset_token: yup
                    .string()
                    .required('Token para resetar está faltando!'),
                password: yup
                    .string()
                    .min(6, 'A senha deve ter no mínimo 6 caracteres')
                    .required('Preencha o campo "senha"'),
                confirm_password: yup
                    .string()
                    .oneOf([yup.ref('password'), null], 'Senhas diferentes!')
                    .required('Preencha o campo "confirmar senha"'),
            })
            .required(),
        response: {
            200: defaultMessage,
            400: defaultMessage,
            500: defaultError,
        },
    },

    delete: {
        response: {
            200: defaultMessage,
            '4xx': defaultMessage,
            500: defaultError,
        },
    },

    restore: {
        response: {
            200: defaultMessage,
            '4xx': defaultMessage,
            500: defaultError,
        },
    },
};
