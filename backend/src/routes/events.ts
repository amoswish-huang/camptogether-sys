import { Router, Request, Response } from 'express';
import { getDb, Collections, toISOString } from '../services/firestore.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/events - List all events
router.get('/', async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const snapshot = await db.collection(Collections.EVENTS)
            .orderBy('start_date', 'desc')
            .get();

        const events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            start_date: toISOString(doc.data().start_date),
            end_date: toISOString(doc.data().end_date),
            created_at: toISOString(doc.data().created_at),
        }));

        res.json(events);
    } catch (error) {
        logger.error('Error fetching events', { error: String(error) });
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

        const data = doc.data()!;
        res.json({
            id: doc.id,
            ...data,
            start_date: toISOString(data.start_date),
            end_date: toISOString(data.end_date),
            created_at: toISOString(data.created_at),
        });
    } catch (error) {
        logger.error('Error fetching event', { error: String(error), id: req.params.id });
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// POST /api/events - Create event
router.post('/', async (req: Request, res: Response) => {
    try {
        const { title, description, location_name, location_address, start_date, end_date, host_id } = req.body;

        if (!title || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const db = getDb();
        const eventData = {
            title,
            description: description || '',
            location_name: location_name || '',
            location_address: location_address || '',
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            host_id,
            attendee_ids: host_id ? [host_id] : [],
            invite_token: crypto.randomUUID(),
            is_public: false,
            created_at: new Date(),
        };

        const docRef = await db.collection(Collections.EVENTS).add(eventData);

        res.status(201).json({ id: docRef.id, ...eventData });
    } catch (error) {
        logger.error('Error creating event', { error: String(error) });
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// PUT /api/events/:id - Update event
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const db = getDb();
        const docRef = db.collection(Collections.EVENTS).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Convert date strings
        if (updates.start_date) updates.start_date = new Date(updates.start_date);
        if (updates.end_date) updates.end_date = new Date(updates.end_date);

        await docRef.update(updates);

        res.json({ id, ...updates });
    } catch (error) {
        logger.error('Error updating event', { error: String(error), id: req.params.id });
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = getDb();

        await db.collection(Collections.EVENTS).doc(id).delete();

        res.json({ success: true });
    } catch (error) {
        logger.error('Error deleting event', { error: String(error), id: req.params.id });
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// GET /api/events/:id/checklist - Get checklist items
router.get('/:id/checklist', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
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
router.post('/:id/checklist', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, quantity, note, item_type, is_personal, assigned_to_id } = req.body;

        const db = getDb();
        const itemData = {
            event_id: id,
            name,
            quantity: quantity || 1,
            note: note || '',
            item_type: item_type || 'GEAR',
            is_personal: is_personal || false,
            is_checked: false,
            assigned_to_id: assigned_to_id || null,
            claims: [],
            created_at: new Date(),
        };

        const docRef = await db.collection(Collections.CHECKLIST_ITEMS).add(itemData);

        res.status(201).json({ id: docRef.id, ...itemData });
    } catch (error) {
        logger.error('Error adding checklist item', { error: String(error) });
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// PUT /api/events/:eventId/checklist/:itemId/toggle - Toggle item
router.put('/:eventId/checklist/:itemId/toggle', async (req: Request, res: Response) => {
    try {
        const { itemId } = req.params;
        const db = getDb();

        const docRef = db.collection(Collections.CHECKLIST_ITEMS).doc(itemId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const newChecked = !doc.data()!.is_checked;
        await docRef.update({ is_checked: newChecked });

        res.json({ is_checked: newChecked });
    } catch (error) {
        logger.error('Error toggling item', { error: String(error) });
        res.status(500).json({ error: 'Failed to toggle item' });
    }
});

// GET /api/events/:id/expenses - Get expenses
router.get('/:id/expenses', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
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
router.post('/:id/expenses', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { description, amount, payer_id, split_among_ids } = req.body;

        const db = getDb();
        const expenseData = {
            event_id: id,
            description,
            amount: Number(amount),
            payer_id,
            split_among_ids: split_among_ids || [],
            created_at: new Date(),
        };

        const docRef = await db.collection(Collections.EXPENSES).add(expenseData);

        res.status(201).json({ id: docRef.id, ...expenseData });
    } catch (error) {
        logger.error('Error adding expense', { error: String(error) });
        res.status(500).json({ error: 'Failed to add expense' });
    }
});

// POST /api/events/:id/join - Join event
router.post('/:id/join', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        const db = getDb();
        const docRef = db.collection(Collections.EVENTS).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const data = doc.data()!;
        const attendees = data.attendee_ids || [];

        if (!attendees.includes(user_id)) {
            attendees.push(user_id);
            await docRef.update({ attendee_ids: attendees });
        }

        res.json({ success: true });
    } catch (error) {
        logger.error('Error joining event', { error: String(error) });
        res.status(500).json({ error: 'Failed to join event' });
    }
});

export { router as eventsRouter };
