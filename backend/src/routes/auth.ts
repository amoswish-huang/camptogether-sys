import { Router, Request, Response } from 'express';
import { getDb, Collections } from '../services/firestore.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/auth/user/:id - Get user by ID
router.get('/user/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = getDb();

        const userDoc = await db.collection(Collections.USERS).doc(id).get();
        const profileDoc = await db.collection(Collections.USER_PROFILES)
            .where('django_user_id', '==', parseInt(id))
            .limit(1)
            .get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userDoc.data();
        const profile = profileDoc.empty ? null : profileDoc.docs[0].data();

        res.json({
            id,
            username: user?.username,
            email: user?.email,
            nickname: profile?.nickname || user?.username,
            avatar: profile?.avatar,
            bio: profile?.bio,
        });
    } catch (error) {
        logger.error('Error fetching user', { error: String(error) });
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// GET /api/auth/users - Get all users (for attendee selection)
router.get('/users', async (req: Request, res: Response) => {
    try {
        const db = getDb();

        const usersSnapshot = await db.collection(Collections.USERS).get();
        const profilesSnapshot = await db.collection(Collections.USER_PROFILES).get();

        const profilesMap = new Map<number, FirebaseFirestore.DocumentData>();
        profilesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.django_user_id) {
                profilesMap.set(data.django_user_id, data);
            }
        });

        const users = usersSnapshot.docs.map(doc => {
            const user = doc.data();
            const djangoPk = user.django_pk || parseInt(doc.id);
            const profile = profilesMap.get(djangoPk);

            return {
                id: doc.id,
                django_pk: djangoPk,
                username: user.username,
                email: user.email,
                nickname: profile?.nickname || user.username,
                avatar: profile?.avatar,
            };
        });

        res.json(users);
    } catch (error) {
        logger.error('Error fetching users', { error: String(error) });
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/auth/line - LINE login
router.post('/line', async (req: Request, res: Response) => {
    try {
        const { lineUserId, displayName, pictureUrl } = req.body;

        if (!lineUserId) {
            return res.status(400).json({ error: 'LINE user ID required' });
        }

        const db = getDb();

        // Find existing user by LINE user ID
        const profileSnapshot = await db.collection(Collections.USER_PROFILES)
            .where('line_user_id', '==', lineUserId)
            .limit(1)
            .get();

        if (!profileSnapshot.empty) {
            const profile = profileSnapshot.docs[0].data();
            const userId = profile.django_user_id;

            const userDoc = await db.collection(Collections.USERS).doc(String(userId)).get();
            const user = userDoc.data();

            return res.json({
                user: {
                    id: userId,
                    username: user?.username,
                    nickname: profile.nickname,
                    avatar: profile.avatar || pictureUrl,
                },
                token: `session-${userId}-${Date.now()}`, // Simplified session token
            });
        }

        // Create new user
        const usersSnapshot = await db.collection(Collections.USERS).get();
        const newUserId = usersSnapshot.size + 1;

        const userData = {
            django_pk: newUserId,
            username: `line_${lineUserId.slice(-8)}`,
            email: '',
            first_name: displayName || '',
            last_name: '',
            is_staff: false,
            is_superuser: false,
            date_joined: new Date(),
        };

        await db.collection(Collections.USERS).doc(String(newUserId)).set(userData);

        const profileData = {
            django_pk: newUserId,
            django_user_id: newUserId,
            nickname: displayName || '',
            line_user_id: lineUserId,
            avatar: pictureUrl || '',
            bio: '',
        };

        await db.collection(Collections.USER_PROFILES).add(profileData);

        res.json({
            user: {
                id: newUserId,
                username: userData.username,
                nickname: displayName,
                avatar: pictureUrl,
            },
            token: `session-${newUserId}-${Date.now()}`,
        });
    } catch (error) {
        logger.error('Error LINE login', { error: String(error) });
        res.status(500).json({ error: 'Failed to login' });
    }
});

export { router as authRouter };
