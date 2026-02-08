import { initializeApp } from 'firebase/app'
import {
    getAuth,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup,
    signOut,
    User,
} from 'firebase/auth'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()
const lineProvider = new OAuthProvider('oidc.line')
lineProvider.addScope('openid')
lineProvider.addScope('profile')
lineProvider.addScope('email')

export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, googleProvider)
        return result.user
    } catch (error) {
        console.error('Google sign-in error:', error)
        return null
    }
}

export const signInWithLine = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, lineProvider)
        return result.user
    } catch (error) {
        console.error('LINE sign-in error:', error)
        return null
    }
}

export const logout = async () => {
    try {
        await signOut(auth)
    } catch (error) {
        console.error('Logout error:', error)
    }
}

export const getAuthToken = async (): Promise<string | null> => {
    const user = auth.currentUser
    if (!user) return null
    return user.getIdToken()
}
