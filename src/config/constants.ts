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
        },
    },

    errorJwtMessages: {
        badRequestErrorMessage: 'Sessão inválida!',
        noAuthorizationInHeaderMessage: 'Sem autorização!',
        authorizationTokenExpiredMessage: 'Sessão expirada!',
    },
};
