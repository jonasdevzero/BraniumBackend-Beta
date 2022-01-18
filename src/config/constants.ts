export const constants = {
    client: {
        routes: {
            forgotPassword: (token: string) =>
                `${process.env.CLIENT_URL}/resetar-senha/${token}`,
            completeRegistration: (token: string) =>
                `${process.env.CLIENT_URL}/finalizar-cadastro/${token}`,
        },

        actions: {
            UPDATE_USER: 'UPDATE_USER',
            USER_PUSH_DATA: 'USER_PUSH_DATA',
            USER_REMOVE_DATA: 'USER_REMOVE_DATA',
            PUSH_CONTACT_MESSAGE: 'PUSH_CONTACT_MESSAGE',
            UPDATE_ROOM: 'UPDATE_ROOM',
            SET_CONTACTS_ONLINE: 'SET_CONTACTS_ONLINE',
            VIEW_CONTACT_MESSAGES: 'VIEW_CONTACT_MESSAGES',
            VIEW_GROUP_MESSAGES: 'VIEW_GROUP_MESSAGES',
            REMOVE_ROOM_MESSAGE: 'REMOVE_ROOM_MESSAGE',
            PUSH_GROUP_MESSAGE: 'REMOVE_ROOM_MESSAGE',
            PUSH_GROUP_USER: 'PUSH_GROUP_USER',
            UPDATE_GROUP_USER: 'UPDATE_GROUP_USER',
            REMOVE_GROUP_USER: 'REMOVE_GROUP_USER',
        },
    },

    socketActions: {
        warn(type: 'info' | 'success' | 'error', message: string) {
            return {
                type,
                message,
            };
        },

        update(
            type: string,
            args: {
                field?: string;
                where?: {
                    id?: string;
                    [key: string]: any;
                };
                set?: { [key: string]: any };
            },
        ) {
            return {
                type,
                ...args,
            };
        },
    },

    errorJwtMessages: {
        badRequestErrorMessage: 'Sessão inválida!',
        noAuthorizationInHeaderMessage: 'Sem autorização!',
        authorizationTokenExpiredMessage: 'Sessão expirada!',
    },
};
