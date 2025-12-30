
import { z } from 'zod';

export const createUserSchema = z.object({
    dni: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
    password: z.string().min(6),
    extra_fields: z.record(z.string()).optional()
});
