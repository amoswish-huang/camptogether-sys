import { z } from 'zod';

const amountSchema = z.preprocess(
    (value) => (typeof value === 'string' ? Number(value) : value),
    z.number().positive(),
);

export const createExpenseSchema = z.object({
    description: z.string().min(1).max(200),
    amount: amountSchema,
    split_among_ids: z.array(z.string()).optional().default([]),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
