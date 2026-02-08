import { Router, Request, Response } from 'express';
import { getDb, Collections, toISOString } from '../services/firestore.js';
import { logger } from '../utils/logger.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { isAdminEmail } from '../utils/admin.js';

const router = Router();

const mapUser = (id: string, data: FirebaseFirestore.DocumentData) => ({
    id,
    uid: data.uid,
    email: data.email,
    display_name: data.display_name,
    photo_url: data.photo_url,
    roles: data.roles || [],
    created_at: toISOString(data.created_at),
    last_login_at: toISOString(data.last_login_at),
});

const upsertUser = async (user: { uid: string; email?: string | null; name?: string | null; picture?: string | null }) => {
    const db = getDb();
    const docRef = db.collection(Collections.USERS).doc(user.uid);
    const doc = await docRef.get();

    if (!doc.exists) {
        const data = {
            uid: user.uid,
            email: user.email || '',
            display_name: user.name || '',
            photo_url: user.picture || '',
            roles: isAdminEmail(user.email) ? ['admin'] : [],
            created_at: new Date(),
            last_login_at: new Date(),
        };
        await docRef.set(data);
        return { id: docRef.id, ...data };
    }

    const existing = doc.data()!;
    const nextRoles = isAdminEmail(user.email) ? ['admin'] : (existing.roles || []);
    const updates = {
        email: user.email || existing.email || '',
        display_name: user.name || existing.display_name || '',
        photo_url: user.picture || existing.photo_url || '',
        roles: nextRoles,
        last_login_at: new Date(),
    };
    await docRef.update(updates);

    return { id: docRef.id, ...existing, ...updates };
};

// GET /api/auth/me - Get or create current user
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    try {
        const userRecord = await upsertUser(req.user!);
        res.json(mapUser(userRecord.id, userRecord));
    } catch (error) {
        logger.error('Error fetching current user', { error: String(error) });
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// GET /api/auth/user/:id - Get user by ID (self or admin)
router.get('/user/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (req.user!.uid !== id && !isAdminEmail(req.user!.email)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const db = getDb();
        const userDoc = await db.collection(Collections.USERS).doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(mapUser(userDoc.id, userDoc.data()!));
    } catch (error) {
        logger.error('Error fetching user', { error: String(error) });
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// GET /api/auth/users - Admin list users
router.get('/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10), 1), 100);
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : '';

        let query: FirebaseFirestore.Query = db.collection(Collections.USERS)
            .orderBy('created_at', 'desc')
            .limit(limit);

        if (cursor) {
            const cursorDoc = await db.collection(Collections.USERS).doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc);
            }
        }

        const snapshot = await query.get();
        const users = snapshot.docs.map(doc => mapUser(doc.id, doc.data()));
        const nextCursor = snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1].id : null;

        res.json({ items: users, next_cursor: nextCursor });
    } catch (error) {
        logger.error('Error fetching users', { error: String(error) });
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export { router as authRouter };
