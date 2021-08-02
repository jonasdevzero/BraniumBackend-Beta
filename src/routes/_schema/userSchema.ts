const defaultResponse = {
    type: "object",
    properties: {
        message: { type: "string" },
        error: { type: "string", nullable: true }
    }
}

const index = {
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
}

const search = {
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
        },
        400: defaultResponse,
        500: defaultResponse
    }
}

const create = {
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

const login = {
    response: {
        200: {
            type: "object",
            properties: {
                token: { type: "string" }
            }
        },
        "4xx": defaultResponse,
        500: defaultResponse
    }
}

const auth = {
    response: {
        200: {
            type: "object",
            properties: {
                user: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        username: { type: "string" },
                        email: { type: "string" },
                        picture: { type: "string" },
                        invitations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {}
                            }
                        },
                        contacts: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {}
                            },
                        }
                    }
                }
            }
        },
        400: defaultResponse,
        500: defaultResponse
    }
}

const update = {
    response: {
        400: defaultResponse,
        500: defaultResponse
    }
}

const email = {
    response: {
        200: {
            type: "object",
            properties: {
                email: { type: "string" }
            }
        },
        "4xx": defaultResponse,
        500: defaultResponse
    }
}

const picture = {
    response: {
        200: {
            type: "object",
            properties: {
                location: { type: "string", nullable: true }
            }
        },
        "4xx": defaultResponse,
        500: defaultResponse
    }
}

const forgotPassword = {
    response: {
        200: defaultResponse,
        400: defaultResponse,
        500: defaultResponse
    }
}

const resetPassword = {
    response: {
        200: defaultResponse,
        400: defaultResponse,
        500: defaultResponse
    }
}

const Sdelete = {
    response: {
        200: defaultResponse,
        "4xx": defaultResponse,
        500: defaultResponse
    }
}

const restore = {
    response: {
        200: defaultResponse,
        "4xx": defaultResponse,
        500: defaultResponse
    }
}

export default {
    index,
    search,
    create,
    login,
    auth,
    update,
    email,
    picture,
    forgotPassword,
    resetPassword,
    Sdelete,
    restore
}