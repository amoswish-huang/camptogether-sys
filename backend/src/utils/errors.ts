export class ValidationError extends Error {
    details?: Record<string, unknown>;

    constructor(message: string, details?: Record<string, unknown>) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}
