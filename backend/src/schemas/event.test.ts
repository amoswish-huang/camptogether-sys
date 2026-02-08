import { describe, it, expect } from 'vitest';
import { createEventSchema } from './event.js';

describe('createEventSchema', () => {
    it('accepts valid payload', () => {
        const payload = {
            title: 'Camp Together',
            start_date: '2026-02-10',
            end_date: '2026-02-12',
            is_public: true,
        };

        expect(() => createEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid date range', () => {
        const payload = {
            title: 'Camp Together',
            start_date: '2026-02-12',
            end_date: '2026-02-10',
        };

        const result = createEventSchema.safeParse(payload);
        expect(result.success).toBe(false);
    });
});
