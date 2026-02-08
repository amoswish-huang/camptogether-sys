import { Firestore } from '@google-cloud/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID || 'camptogether';

let db: Firestore | null = null;

export const getDb = (): Firestore => {
    if (!db) {
        db = new Firestore({ projectId });
    }
    return db;
};

// Collection names
export const Collections = {
    USERS: 'users',
    USER_PROFILES: 'user_profiles',
    EVENTS: 'events',
    CHECKLIST_ITEMS: 'checklist_items',
    EXPENSES: 'expenses',
    JOIN_REQUESTS: 'join_requests',
} as const;

// Helper to convert Firestore timestamp to ISO string
export const toISOString = (timestamp: FirebaseFirestore.Timestamp | Date | null): string | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp.toISOString();
    return timestamp.toDate().toISOString();
};
