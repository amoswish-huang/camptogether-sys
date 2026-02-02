import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyAOcwo4LR7ZmeLEGbPnwj5lgLMsqADCGyQ",
    authDomain: "gooddaybnb-99788.firebaseapp.com",
    projectId: "gooddaybnb-99788",
    storageBucket: "gooddaybnb-99788.firebasestorage.app",
    messagingSenderId: "495298982618",
    appId: "1:495298982618:web:545b2e9a0f72c88be46be3"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, googleProvider)
        return result.user
    } catch (error) {
        console.error('Google sign-in error:', error)
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

// Admin emails (you can customize this list)
export const ADMIN_EMAILS = [
    'amoswish@gmail.com',
]

export const isAdmin = (email: string | null): boolean => {
    if (!email) return false
    return ADMIN_EMAILS.includes(email)
}
