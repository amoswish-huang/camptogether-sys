import type { Request, Response, NextFunction } from 'express';
import { isAdminEmail } from '../utils/admin.js';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isAdminEmail(req.user.email)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
};
