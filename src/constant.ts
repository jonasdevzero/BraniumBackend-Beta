
export const constant = {
    client: {
        routes: {
            forgotPassword: (token: string) => `${process.env.CLIENT_URL}/resetar-senha/${token}`,
            completeRegistration: (token : string) => `${process.env.CLIENT_URL}/finalizar-cadastro/${token}`
        }
    }
}