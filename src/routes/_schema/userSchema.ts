import { defaultMessage, defaultError } from "./default"

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
                            id: { type: "string" },
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
        400: defaultMessage,
        500: defaultError
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
        400: defaultMessage,
        500: defaultError,
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
        "4xx": defaultMessage,
        500: defaultError
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
                        picture: { type: "string", nullable: true },
                        invitations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    sender: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string" },
                                            username: { type: "string" },
                                            picture: { type: "string", nullable: true },
                                        }
                                    },
                                    sender_id: { type: "string" },
                                    receiver_id: { type: "string" },
                                    created_at: { type: "string" },
                                }
                            }
                        },
                        contacts: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    username: { type: "string" },
                                    picture: { type: "string", nullable: true },
                                    messages: { type: "array", items: {} },
                                    unread_messages: { type: "number" },
                                    last_message_time: { type: "string" },
                                    blocked: { type: "boolean" },
                                    you_blocked: { type: "boolean" },
                                }
                            },
                        }
                    }
                }
            }
        },
        400: defaultMessage,
        500: defaultError
    }
}

const update = {
    response: {
        400: defaultMessage,
        500: defaultError
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
        "4xx": defaultMessage,
        500: defaultError
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
        "4xx": defaultMessage,
        500: defaultError
    }
}

const forgotPassword = {
    response: {
        200: defaultMessage,
        400: defaultMessage,
        500: defaultError
    }
}

const resetPassword = {
    response: {
        200: defaultMessage,
        400: defaultMessage,
        500: defaultError
    }
}

const Sdelete = {
    response: {
        200: defaultMessage,
        "4xx": defaultMessage,
        500: defaultError
    }
}

const restore = {
    response: {
        200: defaultMessage,
        "4xx": defaultMessage,
        500: defaultError
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