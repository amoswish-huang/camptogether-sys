import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID || 'camptogether';

const getFirebaseApp = () => {
    if (!getApps().length) {
        initializeApp({
            credential: applicationDefault(),
            projectId,
        });
    }
    return getApps()[0];
};

export const adminAuth = () => getAuth(getFirebaseApp());
