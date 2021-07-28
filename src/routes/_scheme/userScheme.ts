const defaultResponse = {
    type: "object",
    properties: {
        message: { type: "string" },
        error: { type: "string", nullable: true }
    }
}

export default {
    index: {
        response: {
            200: {
                type: "object",
                properties: {
                    user: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                username: { type: "string" },
                                picture: { type: "string", nullable: true },
                            }
                        }
                    }
                }
            }
        }
    },

    create: {
        body: {
            type: "object",
            properties: {
                name: { type: "string" },
                username: { type: "string" },
                email: { type: "string" },
                password: { type: "string" },
                confirmPassword: { type: "string" },
            }
        },
        response: {
            201: {
                type: "object",
                properties: {
                    token: { type: "string" }
                }
            },
            400: defaultResponse,
            500: defaultResponse,
        }
    }
}