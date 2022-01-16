import { defaultMessage, defaultError } from "../default"

const show = {
    response: {
        200: {
            type: "object",
            properties: {
                contact: {
                    type: "object",
                    properties: {
                        id: { type: 'string' },
                        username: { type: 'string' },
                        picture: { type: 'string' },
                        messages: { type: 'array', items: {} },
                        unread_messages: { type: 'number', nullable: true },
                        last_message_time: { type: "string" },
                        blocked: { type: 'boolean' },
                        you_blocked: { type: 'boolean' },
                    }
                }
            }
        },
        "4xx": defaultMessage,
        500: defaultError
    }
}

const invite = {
    response: {
        201: defaultMessage,
        "4xx": defaultMessage,
        500: defaultError
    }
}

const acceptInvite = {
    response: {
        200: {
            type: "object",
            properties: {
                contact: {
                    type: "object",
                    proerties: {
                        id: { type: 'string' },
                        username: { type: 'string' },
                        picture: { type: 'string' },
                        messages: { type: 'array', items: {} },
                        unread_messages: { type: 'number' },
                        last_message_time: { type: "string" },
                        blocked: { type: 'boolean' },
                        you_blocked: { type: 'boolean' },
                    }
                }
            }
        },
        "4xx": defaultMessage,
        500: defaultError
    }
}

const refuseInvite = {
    response: {
        200: defaultMessage,
        "4xx": defaultMessage,
        500: defaultError
    }
}

const block = {
    response: {
        200: {
            type: "object",
            properties: {
                you_blocked: { type: "boolean" }
            }
        },
        "4xx": defaultMessage,
        500: defaultError
    }
}

export default {
    show,
    invite,
    acceptInvite,
    refuseInvite,
    block,
}