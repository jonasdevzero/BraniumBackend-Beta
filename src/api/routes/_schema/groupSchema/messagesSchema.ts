import { defaultError, defaultMessage } from "../default";

const index = {
    response: {
        "4xx": defaultMessage,
        500: defaultError
    }
};

const create = {
    response: {
        "4xx": defaultMessage,
        500: defaultError
    }
};

const view = {
    response: {
        "4xx": defaultMessage,
        500: defaultError
    }
};

const deleteMessage = {
    response: {
        "4xx": defaultMessage,
        500: defaultError
    }
};

export default {
    index,
    create,
    view,
    deleteMessage,
};
