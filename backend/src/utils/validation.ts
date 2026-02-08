import { ZodSchema } from 'zod';
import { ValidationError } from './errors.js';

export const parseSchema = <T>(schema: ZodSchema<T>, data: unknown, message = 'Validation failed'): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new ValidationError(message, { issues: result.error.issues });
    }
    return result.data;
};
