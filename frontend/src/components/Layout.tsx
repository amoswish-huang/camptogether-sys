import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { logout } from '../services/firebase'

export default function Layout() {
    const { user, profile, isAdminUser } = useAuth()

    return (
        <>
            <header className="header">
                <div className="container header-inner">
                    <Link to="/" className="logo">
                        <span>🏕️</span> CampTogether
                    </Link>
                    <nav className="nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isAdminUser && (
                            <Link to="/admin" className="btn btn-secondary">
                                管理後台
                            </Link>
                        )}
                        <Link to="/events/create" className="btn btn-primary">
                            ＋ 發起活動
                        </Link>
                        {user ? (
                            <button type="button" className="btn btn-secondary" onClick={logout}>
                                登出 {profile?.display_name || user.displayName || user.email}
                            </button>
                        ) : (
                            <Link to="/login" className="btn btn-secondary">
                                登入
                            </Link>
                        )}
                    </nav>
                </div>
            </header>
            <main>
                <Outlet />
            </main>
        </>
    )
}
