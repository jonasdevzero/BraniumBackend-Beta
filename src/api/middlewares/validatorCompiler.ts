import { yupOptions } from '../../config/yup';
import { parseBody } from '../helpers';

export default function validatorCompiler({ schema }: any) {
    return (data: any) => {
        try {
            const body = parseBody(data)
            const resutl = schema.validateSync(body, yupOptions);
            
            return { value: resutl };
        } catch (e: any) {
            // yup errors
            return { error: e.errors };
        }
    };
}
