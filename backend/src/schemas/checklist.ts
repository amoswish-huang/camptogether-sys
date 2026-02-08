import { z } from 'zod';

const quantitySchema = z.preprocess(
    (value) => (typeof value === 'string' ? Number(value) : value),
    z.number().int().positive(),
);

export const createChecklistSchema = z.object({
    name: z.string().min(1).max(120),
    quantity: quantitySchema.optional().default(1),
    note: z.string().max(200).optional().default(''),
    item_type: z.enum(['GEAR', 'FOOD']).optional().default('GEAR'),
    is_personal: z.boolean().optional().default(false),
    assigned_to_id: z.string().optional().nullable().default(null),
});

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
