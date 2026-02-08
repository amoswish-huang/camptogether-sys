import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { eventsRouter } from './routes/events.js';
import { authRouter } from './routes/auth.js';
import { logger } from './utils/logger.js';
import { ValidationError } from './utils/errors.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for Cloud Run
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
});
app.use(limiter);

// CORS
const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://camptogether.gooddaybnb.com',
    'https://camptogether.web.app',
    'https://camptogether.firebaseapp.com',
];
const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic access logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        logger.info('request', {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            duration_ms: Date.now() - start,
        });
    });
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
    });
});

// API routes
app.use('/api/events', eventsRouter);
app.use('/api/auth', authRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message, details: err.details });
    }

    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    logger.info(`🏕️ CampTogether API running on port ${PORT}`);
});

export default app;
