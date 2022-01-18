import * as yup from 'yup';
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
    body: yup
        .object({
            name: yup.string().required('Campo "name" é obrigatório'),
            description: yup
                .string()
                .required('Campo "description" é obrigatório'),
            picture: yup
                .object()
                .typeError('Formto do campo "picture" inválido!'),
            members: yup.lazy((value: any) => {
                return typeof value === 'string'
                    ? yup.string().uuid('Campo "members" inválido!')
                    : Array.isArray(value)
                    ? yup
                          .array()
                          .of(yup.string().uuid('Campo "members" inválido!'))
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
                    },
                },
            },
        },
        '4xx': defaultMessage,
        500: defaultError,
    },
};

const update = {
    body: yup
        .object({
            name: yup.string().required('Campo "name" é obrigatório!'),
            description: yup.string().required('Campo "name" é obrigatório!'),
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
};

const update_picture = {
    body: yup
        .object({
            picture: yup
                .object()
                .typeError('Formato do campo "picture" é inválido!'),
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
