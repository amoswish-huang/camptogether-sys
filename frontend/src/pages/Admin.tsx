import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { signInWithGoogle, logout } from '../services/firebase'
import api, { Event, User as AppUser } from '../services/api'

export default function Admin() {
    const { user, loading, isAdminUser } = useAuth()
    const [events, setEvents] = useState<Event[]>([])
    const [users, setUsers] = useState<AppUser[]>([])
    const [activeTab, setActiveTab] = useState<'events' | 'users'>('events')
    const [dataLoading, setDataLoading] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)

    useEffect(() => {
        if (isAdminUser) {
            loadData()
        }
    }, [isAdminUser])

    const loadData = async () => {
        setDataLoading(true)
        try {
            const [eventsData, usersData] = await Promise.all([
                api.getEvents(),
                api.getUsers(),
            ])
            setEvents(eventsData)
            setUsers(usersData)
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setDataLoading(false)
        }
    }

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('確定要刪除這個活動嗎？')) return
        try {
            await api.deleteEvent(id)
            setEvents(prev => prev.filter(e => e.id !== id))
        } catch (error) {
            alert('刪除失敗')
        }
    }

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingEvent) return

        try {
            await api.updateEvent(editingEvent.id, editingEvent)
            setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? editingEvent : ev))
            setEditingEvent(null)
        } catch (error) {
            alert('更新失敗')
        }
    }

    if (loading) {
        return (
            <div className="container">
                <div className="loading"><div className="spinner"></div></div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container">
                <div className="hero" style={{ maxWidth: 500, margin: '60px auto' }}>
                    <h1 className="hero-title">🔐 管理後台</h1>
                    <p className="hero-subtitle">請使用 Google 帳號登入</p>
                    <button className="btn btn-primary" onClick={signInWithGoogle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        使用 Google 登入
                    </button>
                </div>
            </div>
        )
    }

    if (!isAdminUser) {
        return (
            <div className="container">
                <div className="hero" style={{ maxWidth: 500, margin: '60px auto' }}>
                    <h1 className="hero-title">⛔ 權限不足</h1>
                    <p className="hero-subtitle">你的帳號 ({user.email}) 沒有管理員權限</p>
                    <button className="btn btn-secondary" onClick={logout}>登出</button>
                </div>
            </div>
        )
    }

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">🛠️ 管理後台</h1>
                    <p className="page-subtitle">歡迎, {user.displayName || user.email}</p>
                </div>
                <button className="btn btn-secondary" onClick={logout}>登出</button>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('events')}
                >
                    📅 活動管理 ({events.length})
                </button>
                <button
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 用戶列表 ({users.length})
                </button>
            </div>

            {dataLoading ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : (
                <>
                    {activeTab === 'events' && (
                        <div>
                            {editingEvent && (
                                <div className="card" style={{ marginBottom: 20, background: 'var(--color-bg-hover)' }}>
                                    <h3 style={{ marginBottom: 16 }}>✏️ 編輯活動</h3>
                                    <form onSubmit={handleUpdateEvent}>
                                        <div className="form-group">
                                            <label className="form-label">活動名稱</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={editingEvent.title}
                                                onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">地點</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={editingEvent.location_name}
                                                onChange={e => setEditingEvent({ ...editingEvent, location_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-2">
                                            <div className="form-group">
                                                <label className="form-label">開始日期</label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={editingEvent.start_date?.split('T')[0] || ''}
                                                    onChange={e => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">結束日期</label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={editingEvent.end_date?.split('T')[0] || ''}
                                                    onChange={e => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editingEvent.is_public}
                                                    onChange={e => setEditingEvent({ ...editingEvent, is_public: e.target.checked })}
                                                />
                                                公開招募
                                            </label>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button type="submit" className="btn btn-primary">儲存</button>
                                            <button type="button" className="btn btn-secondary" onClick={() => setEditingEvent(null)}>取消</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-hover)', textAlign: 'left' }}>
                                        <th style={{ padding: 12 }}>活動名稱</th>
                                        <th style={{ padding: 12 }}>地點</th>
                                        <th style={{ padding: 12 }}>日期</th>
                                        <th style={{ padding: 12 }}>參加人數</th>
                                        <th style={{ padding: 12 }}>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map(event => (
                                        <tr key={event.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: 12 }}>
                                                <a href={`/events/${event.id}`} target="_blank" rel="noopener noreferrer">
                                                    {event.title}
                                                </a>
                                                {event.is_public && <span className="badge badge-gear" style={{ marginLeft: 8 }}>公開</span>}
                                            </td>
                                            <td style={{ padding: 12, color: 'var(--color-text-muted)' }}>{event.location_name}</td>
                                            <td style={{ padding: 12, color: 'var(--color-text-muted)' }}>
                                                {event.start_date?.split('T')[0]}
                                            </td>
                                            <td style={{ padding: 12 }}>{event.attendee_ids?.length || 0}</td>
                                            <td style={{ padding: 12 }}>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                        onClick={() => setEditingEvent(event)}
                                                    >
                                                        編輯
                                                    </button>
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'var(--color-error)', color: 'white' }}
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                    >
                                                        刪除
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-hover)', textAlign: 'left' }}>
                                    <th style={{ padding: 12 }}>ID</th>
                                    <th style={{ padding: 12 }}>名稱</th>
                                    <th style={{ padding: 12 }}>帳號</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: 12, color: 'var(--color-text-muted)' }}>{u.id}</td>
                                        <td style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {u.avatar && (
                                                <img
                                                    src={u.avatar}
                                                    alt={u.nickname}
                                                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                            )}
                                            {u.nickname || u.username}
                                        </td>
                                        <td style={{ padding: 12, color: 'var(--color-text-muted)' }}>{u.username}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    )
}
