import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import api, { UserProfile } from '../services/api'

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    loading: boolean
    isAdminUser: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAdminUser: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [profileLoading, setProfileLoading] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
            setLoading(false)
        })
        return unsubscribe
    }, [])

    useEffect(() => {
        if (!user) {
            setProfile(null)
            return
        }

        setProfileLoading(true)
        api.getMe()
            .then(setProfile)
            .catch(error => {
                console.error('Failed to fetch profile', error)
                setProfile(null)
            })
            .finally(() => setProfileLoading(false))
    }, [user])

    const isAdminUser = profile?.roles?.includes('admin') ?? false

    return (
        <AuthContext.Provider value={{ user, profile, loading: loading || profileLoading, isAdminUser }}>
            {children}
        </AuthContext.Provider>
    )
}
