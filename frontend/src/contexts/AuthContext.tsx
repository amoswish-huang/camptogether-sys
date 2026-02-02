import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth, isAdmin } from '../services/firebase'

interface AuthContextType {
    user: User | null
    loading: boolean
    isAdminUser: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdminUser: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user)
            setLoading(false)
        })
        return unsubscribe
    }, [])

    const isAdminUser = isAdmin(user?.email ?? null)

    return (
        <AuthContext.Provider value={{ user, loading, isAdminUser }}>
            {children}
        </AuthContext.Provider>
    )
}
