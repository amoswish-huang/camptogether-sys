import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
    return (
        <>
            <header className="header">
                <div className="container header-inner">
                    <Link to="/" className="logo">
                        <span>🏕️</span> CampTogether
                    </Link>
                    <nav className="nav">
                        <Link to="/events/create" className="btn btn-primary">
                            ＋ 發起活動
                        </Link>
                    </nav>
                </div>
            </header>
            <main>
                <Outlet />
            </main>
        </>
    )
}
