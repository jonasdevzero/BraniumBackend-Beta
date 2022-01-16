import { yupOptions } from "../../config/yup";

export default function validatorCompiler({ schema }: any) {
    return (data: any) => {
        try {
            const result = schema.validateSync(data, yupOptions);
            return { value: result };
        } catch (e: any) {
            // yup errors
            return { error: e.errors };
        }
    };
}
