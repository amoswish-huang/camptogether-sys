import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { Event } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
    const { user } = useAuth()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        setLoading(true)
        api.getEvents()
            .then(data => setEvents(data.items))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [user])

    const formatDate = (dateStr: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
    }

    if (loading) {
        return (
            <div className="container">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container">
            <div className="hero">
                <h1 className="hero-title">🏕️ CampTogether</h1>
                <p className="hero-subtitle">和朋友一起規劃露營活動，分配裝備、紀錄費用、輕鬆分帳</p>
                <Link to="/events/create" className="btn btn-accent">
                    🎯 發起新活動
                </Link>
            </div>

            <div className="page-header">
                <h2 className="page-title">📅 所有活動</h2>
                <p className="page-subtitle">共 {events.length} 個活動</p>
            </div>

            {error && (
                <div className="card" style={{ color: 'var(--color-error)' }}>
                    載入失敗: {error}
                </div>
            )}

            {events.length === 0 && !error ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏕️</div>
                    <p>還沒有活動，趕快發起一個吧！</p>
                    <Link to="/events/create" className="btn btn-primary" style={{ marginTop: 20 }}>
                        發起活動
                    </Link>
                </div>
            ) : (
                <div className="grid grid-2">
                    {events.map(event => (
                        <Link key={event.id} to={`/events/${event.id}`} className="card event-card">
                            <h3 className="event-card-title">{event.title}</h3>
                            <div className="event-card-meta">
                                <span>📍 {event.location_name || '未設定地點'}</span>
                                <span>📆 {formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                                <span>👥 {event.attendee_ids?.length || 0} 人參加</span>
                            </div>
                            {event.is_public && <span className="badge badge-gear">公開招募</span>}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
