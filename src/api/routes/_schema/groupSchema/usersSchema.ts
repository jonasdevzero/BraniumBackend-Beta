import { defaultError, defaultMessage } from "../default";

const index = {
    response: {
        "4xx": defaultMessage,
        500: defaultError
    }
};

const add = {
    response: {
        "4xx": defaultMessage,
        500: defaultError
    }
};

const role = {
    response: {
        "4xx": defaultMessage,
        500: defaultError
    }
};

const remove = {
    response: {
        "4xx": defaultMessage,
        500: defaultError
    }
};

export default {
    index,
    add,
    role,
    remove,
};
