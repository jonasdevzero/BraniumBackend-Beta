
const index = {
    querystring: {
        type: "object",
        properties: {
            limit: { type: "number", nullable: true },
            skip: { type: "number", nullable: true }
        }
    },
    response: {
        200: {
            type: "object",
            properties: {
                messages: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            text: { type: "string" },
                            sender_id: { type: "string" },
                            bidirectional_id: { type: "string" },
                            viewed: { type: "boolean" },
                            created_at: { type: "string" },
                        }
                    }
                }
            }
        }
    }
}

export default {
    index
}