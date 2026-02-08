import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../services/firebaseAdmin.js';

export interface AuthUser {
    uid: string;
    email?: string | null;
    name?: string | null;
    picture?: string | null;
}

declare module 'express-serve-static-core' {
    interface Request {
        user?: AuthUser;
    }
}

const getTokenFromHeader = (req: Request): string | null => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = getTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({ error: 'Missing auth token' });
        }

        const decoded = await adminAuth().verifyIdToken(token);
        req.user = {
            uid: decoded.uid,
            email: decoded.email ?? null,
            name: decoded.name ?? decoded.displayName ?? null,
            picture: decoded.picture ?? decoded.photoURL ?? null,
        };

        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid auth token' });
    }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = getTokenFromHeader(req);
        if (!token) return next();

        const decoded = await adminAuth().verifyIdToken(token);
        req.user = {
            uid: decoded.uid,
            email: decoded.email ?? null,
            name: decoded.name ?? decoded.displayName ?? null,
            picture: decoded.picture ?? decoded.photoURL ?? null,
        };
        return next();
    } catch {
        return next();
    }
};
