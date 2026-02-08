import { Router, Request, Response } from 'express';
import { FieldValue } from '@google-cloud/firestore';
import { getDb, Collections, toISOString } from '../services/firestore.js';
import { logger } from '../utils/logger.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { parseSchema } from '../utils/validation.js';
import { createEventSchema, updateEventSchema } from '../schemas/event.js';
import { createChecklistSchema } from '../schemas/checklist.js';
import { createExpenseSchema } from '../schemas/expense.js';
import { isAdminEmail } from '../utils/admin.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

const getEventDoc = async (eventId: string) => {
    const db = getDb();
    const docRef = db.collection(Collections.EVENTS).doc(eventId);
    const doc = await docRef.get();
    if (!doc.exists) {
        return null;
    }
    return { docRef, data: doc.data()!, id: doc.id };
};

const canManageEvent = (eventData: FirebaseFirestore.DocumentData, user: { uid: string; email?: string | null }) => {
    if (isAdminEmail(user.email)) return true;
    return eventData.host_id === user.uid;
};

const isEventMember = (eventData: FirebaseFirestore.DocumentData, user: { uid: string; email?: string | null }) => {
    if (isAdminEmail(user.email)) return true;
    if (eventData.host_id === user.uid) return true;
    const attendees = eventData.attendee_ids || [];
    return Array.isArray(attendees) && attendees.includes(user.uid);
};

const mapEvent = (docId: string, data: FirebaseFirestore.DocumentData) => ({
    id: docId,
    ...data,
    start_date: toISOString(data.start_date),
    end_date: toISOString(data.end_date),
    created_at: toISOString(data.created_at),
    updated_at: toISOString(data.updated_at),
});

// GET /api/events - List events
router.get('/', optionalAuth, async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 50);
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : '';
        const scope = typeof req.query.scope === 'string' ? req.query.scope : '';
        const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

        let query: FirebaseFirestore.Query = db.collection(Collections.EVENTS)
            .orderBy('start_date', 'desc')
            .limit(limit);

        if (scope === 'mine') {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            query = query.where('attendee_ids', 'array-contains', req.user.uid);
        } else {
            query = query.where('is_public', '==', true);
        }

        if (search) {
            query = query
                .where('title_lower', '>=', search)
                .where('title_lower', '<=', `${search}\uf8ff`);
        }

        if (cursor) {
            const cursorDoc = await db.collection(Collections.EVENTS).doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc);
            }
        }

        const snapshot = await query.get();

        const events = snapshot.docs.map(doc => mapEvent(doc.id, doc.data()));
        const nextCursor = snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1].id : null;

        res.json({ items: events, next_cursor: nextCursor });
    } catch (error) {
        logger.error('Error fetching events', { error: String(error) });
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// GET /api/events/admin/all - Admin full list
router.get('/admin/all', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const snapshot = await db.collection(Collections.EVENTS)
            .orderBy('start_date', 'desc')
            .get();

        const events = snapshot.docs.map(doc => mapEvent(doc.id, doc.data()));
        res.json(events);
    } catch (error) {
        logger.error('Error fetching admin events', { error: String(error) });
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = getDb();
        const doc = await db.collection(Collections.EVENTS).doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(mapEvent(doc.id, doc.data()!));
    } catch (error) {
        logger.error('Error fetching event', { error: String(error), id: req.params.id });
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// POST /api/events - Create event
router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const input = parseSchema(createEventSchema, req.body);
        const db = getDb();

        const eventData = {
            title: input.title,
            title_lower: input.title.toLowerCase(),
            description: input.description,
            location_name: input.location_name,
            location_address: input.location_address,
            start_date: new Date(input.start_date),
            end_date: new Date(input.end_date),
            host_id: req.user!.uid,
            attendee_ids: [req.user!.uid],
            invite_token: crypto.randomUUID(),
            is_public: input.is_public,
            notices: input.notices || '',
            cover_image: input.cover_image || '',
            google_map_url: input.google_map_url || '',
            created_at: new Date(),
            updated_at: new Date(),
        };

        const docRef = await db.collection(Collections.EVENTS).add(eventData);

        res.status(201).json(mapEvent(docRef.id, eventData));
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message, details: error.details });
        }
        logger.error('Error creating event', { error: String(error) });
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// PUT /api/events/:id - Update event
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateInput = parseSchema(updateEventSchema, req.body);
        const existing = await getEventDoc(id);

        if (!existing) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (!canManageEvent(existing.data, req.user!)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const updates: Record<string, unknown> = {
            ...updateInput,
            updated_at: new Date(),
        };

        if (updateInput.start_date && updateInput.end_date) {
            const start = new Date(updateInput.start_date);
            const end = new Date(updateInput.end_date);
            if (end < start) {
                return res.status(400).json({ error: 'End date must be after start date' });
            }
        }

        if (updateInput.title) {
            updates.title_lower = updateInput.title.toLowerCase();
        }

        if (updateInput.start_date) updates.start_date = new Date(updateInput.start_date);
        if (updateInput.end_date) updates.end_date = new Date(updateInput.end_date);

        await existing.docRef.update(updates);

        res.json({ id, ...updates });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message, details: error.details });
        }
        logger.error('Error updating event', { error: String(error), id: req.params.id });
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existing = await getEventDoc(id);

        if (!existing) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (!canManageEvent(existing.data, req.user!)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await existing.docRef.delete();
        res.json({ success: true });
    } catch (error) {
        logger.error('Error deleting event', { error: String(error), id: req.params.id });
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// GET /api/events/:id/checklist - Get checklist items
router.get('/:id/checklist', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const eventDoc = await getEventDoc(id);
        if (!eventDoc) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (!isEventMember(eventDoc.data, req.user!)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const db = getDb();
        const snapshot = await db.collection(Collections.CHECKLIST_ITEMS)
            .where('event_id', '==', id)
            .get();

        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(items);
    } catch (error) {
        logger.error('Error fetching checklist', { error: String(error) });
        res.status(500).json({ error: 'Failed to fetch checklist' });
    }
});

// POST /api/events/:id/checklist - Add checklist item
router.post('/:id/checklist', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const eventDoc = await getEventDoc(id);
        if (!eventDoc) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (!isEventMember(eventDoc.data, req.user!)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const input = parseSchema(createChecklistSchema, req.body);
        const db = getDb();
        const itemData = {
            event_id: id,
            name: input.name,
            quantity: input.quantity,
            note: input.note,
            item_type: input.item_type,
            is_personal: input.is_personal,
            is_checked: false,
            assigned_to_id: input.assigned_to_id,
            claims: [],
            created_at: new Date(),
        };

        const docRef = await db.collection(Collections.CHECKLIST_ITEMS).add(itemData);

        res.status(201).json({ id: docRef.id, ...itemData });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message, details: error.details });
        }
        logger.error('Error adding checklist item', { error: String(error) });
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// PUT /api/events/:eventId/checklist/:itemId/toggle - Toggle item
router.put('/:eventId/checklist/:itemId/toggle', requireAuth, async (req: Request, res: Response) => {
    try {
        const { eventId, itemId } = req.params;
        const eventDoc = await getEventDoc(eventId);
        if (!eventDoc) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (!isEventMember(eventDoc.data, req.user!)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const db = getDb();
        const itemRef = db.collection(Collections.CHECKLIST_ITEMS).doc(itemId);

        const newChecked = await db.runTransaction(async (tx) => {
            const itemDoc = await tx.get(itemRef);
            if (!itemDoc.exists) {
                throw new Error('ITEM_NOT_FOUND');
            }
            const itemData = itemDoc.data()!;
            if (itemData.event_id !== eventId) {
                throw new Error('ITEM_EVENT_MISMATCH');
            }
            const nextChecked = !itemData.is_checked;
            tx.update(itemRef, { is_checked: nextChecked });
            return nextChecked;
        });

        res.json({ is_checked: newChecked });
    } catch (error) {
        if (error instanceof Error && error.message === 'ITEM_NOT_FOUND') {
            return res.status(404).json({ error: 'Item not found' });
        }
        if (error instanceof Error && error.message === 'ITEM_EVENT_MISMATCH') {
            return res.status(400).json({ error: 'Item does not belong to event' });
        }
        logger.error('Error toggling item', { error: String(error) });
        res.status(500).json({ error: 'Failed to toggle item' });
    }
});

// GET /api/events/:id/expenses - Get expenses
router.get('/:id/expenses', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const eventDoc = await getEventDoc(id);
        if (!eventDoc) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (!isEventMember(eventDoc.data, req.user!)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const db = getDb();
        const snapshot = await db.collection(Collections.EXPENSES)
            .where('event_id', '==', id)
            .get();

        const expenses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(expenses);
    } catch (error) {
        logger.error('Error fetching expenses', { error: String(error) });
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// POST /api/events/:id/expenses - Add expense
router.post('/:id/expenses', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const eventDoc = await getEventDoc(id);
        if (!eventDoc) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (!isEventMember(eventDoc.data, req.user!)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const input = parseSchema(createExpenseSchema, req.body);
        const db = getDb();
        const expenseData = {
            event_id: id,
            description: input.description,
            amount: input.amount,
            payer_id: req.user!.uid,
            split_among_ids: input.split_among_ids,
            created_at: new Date(),
        };

        const docRef = await db.collection(Collections.EXPENSES).add(expenseData);

        res.status(201).json({ id: docRef.id, ...expenseData });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message, details: error.details });
        }
        logger.error('Error adding expense', { error: String(error) });
        res.status(500).json({ error: 'Failed to add expense' });
    }
});

// POST /api/events/:id/join - Join event
router.post('/:id/join', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const eventDoc = await getEventDoc(id);

        if (!eventDoc) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await eventDoc.docRef.update({
            attendee_ids: FieldValue.arrayUnion(req.user!.uid),
        });

        res.json({ success: true });
    } catch (error) {
        logger.error('Error joining event', { error: String(error), id: req.params.id });
        res.status(500).json({ error: 'Failed to join event' });
    }
});

export { router as eventsRouter };
