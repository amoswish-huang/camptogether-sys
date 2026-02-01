type LogLevel = 'INFO' | 'ERROR' | 'DEBUG' | 'WARN';

interface LogMeta {
    [key: string]: unknown;
}

const log = (level: LogLevel, message: string, meta?: LogMeta) => {
    const entry = {
        severity: level,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
    };

    if (level === 'ERROR') {
        console.error(JSON.stringify(entry));
    } else {
        console.log(JSON.stringify(entry));
    }
};

export const logger = {
    info: (message: string, meta?: LogMeta) => log('INFO', message, meta),
    error: (message: string, meta?: LogMeta) => log('ERROR', message, meta),
    warn: (message: string, meta?: LogMeta) => log('WARN', message, meta),
    debug: (message: string, meta?: LogMeta) => {
        if (process.env.NODE_ENV !== 'production') {
            log('DEBUG', message, meta);
        }
    },
};
