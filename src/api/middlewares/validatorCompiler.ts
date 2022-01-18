import { yupOptions } from '../../config/yup';
import { parseBody } from '../helpers';

export default function validatorCompiler({ schema }: any) {
    return (data: any) => {
        try {
            const result = schema.validateSync(
                parseBody(data), // Parse Multipart Object
                yupOptions,
            );
            
            return { value: result };
        } catch (e: any) {
            // yup errors
            return { error: e.errors };
        }
    };
}
