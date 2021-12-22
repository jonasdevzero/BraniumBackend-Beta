import { defaultError, defaultMessage } from "../default";

export default {
  index: {
    querystring: {
      type: "object",
      properties: {
        limit: { type: "number", nullable: true },
        skip: { type: "number", nullable: true },
        skip_u: { type: "number", nullable: true },
      },
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
                medias: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      message_id: { type: "string" },
                      url: { type: "string" },
                      type: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  create: {
    response: {
      201: {
        type: "object",
        properties: {
          to: { type: "string" },
          message: {
            type: "object",
            properties: {
              id: { type: "string" },
              text: { type: "string" },
              sender_id: { type: "string" },
              bidirectional_id: { type: "string" },
              viewed: { type: "boolean" },
              created_at: { type: "string" },
              medias: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    message_id: { type: "string" },
                    url: { type: "string" },
                    type: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      "4xx": defaultError,
      500: defaultError,
    },
  },

  view: {
    response: {
      200: defaultMessage,
      "4xx": defaultError,
      500: defaultError,
    },
  },

  deleteOne: {
    response: {
      200: defaultMessage,
      "4xx": defaultError,
      500: defaultError,
    },
  },

  clear: {
    response: {
      200: defaultMessage,
      "4xx": defaultError,
      500: defaultError,
    },
  },
};
