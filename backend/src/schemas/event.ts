import { z } from 'zod';

const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid date format',
});

const eventBase = z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    location_name: z.string().max(120).optional(),
    location_address: z.string().max(200).optional(),
    start_date: dateString,
    end_date: dateString,
    is_public: z.boolean().optional(),
    notices: z.string().max(2000).optional(),
    cover_image: z.string().max(500).optional(),
    google_map_url: z.string().max(500).optional(),
});

export const createEventSchema = eventBase
    .extend({
        description: eventBase.shape.description.default(''),
        location_name: eventBase.shape.location_name.default(''),
        location_address: eventBase.shape.location_address.default(''),
        is_public: eventBase.shape.is_public.default(false),
    })
    .superRefine((data, ctx) => {
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        if (end < start) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'End date must be after start date',
                path: ['end_date'],
            });
        }
    });

export const updateEventSchema = eventBase.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
