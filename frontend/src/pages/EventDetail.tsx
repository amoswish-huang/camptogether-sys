import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api, { Event, ChecklistItem, Expense } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

type Tab = 'info' | 'gear' | 'food' | 'expense'

export default function EventDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [event, setEvent] = useState<Event | null>(null)
    const [checklist, setChecklist] = useState<ChecklistItem[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [detailError, setDetailError] = useState('')
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('info')

    useEffect(() => {
        if (!id) return

        const load = async () => {
            setLoading(true)
            try {
                const eventData = await api.getEvent(id)
                setEvent(eventData)

                if (user) {
                    try {
                        const [checklistData, expenseData] = await Promise.all([
                            api.getChecklist(id),
                            api.getExpenses(id),
                        ])
                        setChecklist(checklistData)
                        setExpenses(expenseData)
                        setDetailError('')
                    } catch (error) {
                        console.error('Failed to load private data', error)
                        setChecklist([])
                        setExpenses([])
                        setDetailError('無法載入清單與費用，請確認是否加入活動。')
                    }
                } else {
                    setChecklist([])
                    setExpenses([])
                }
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [id, user])

    const toggleItem = async (itemId: string) => {
        if (!id || !user) return
        await api.toggleChecklistItem(id, itemId)
        setChecklist(prev => prev.map(item =>
            item.id === itemId ? { ...item, is_checked: !item.is_checked } : item
        ))
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    if (loading) {
        return (
            <div className="container">
                <div className="loading"><div className="spinner"></div></div>
            </div>
        )
    }

    if (!event) {
        return (
            <div className="container">
                <div className="empty-state">
                    <div className="empty-state-icon">❌</div>
                    <p>活動不存在</p>
                    <Link to="/" className="btn btn-primary">回首頁</Link>
                </div>
            </div>
        )
    }

    const gearItems = checklist.filter(i => i.item_type === 'GEAR')
    const foodItems = checklist.filter(i => i.item_type === 'FOOD')
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)

    return (
        <div className="container">
            <div className="page-header">
                <Link to="/" style={{ color: 'var(--color-text-muted)', marginBottom: 10, display: 'block' }}>
                    ← 回到活動列表
                </Link>
                <h1 className="page-title">{event.title}</h1>
                <div className="event-card-meta" style={{ marginTop: 12 }}>
                    <span>📍 {event.location_name}</span>
                    <span>📆 {formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                    <span>👥 {event.attendee_ids?.length || 0} 人參加</span>
                </div>
            </div>

            {!user && (
                <div className="card" style={{ marginBottom: 20 }}>
                    <p>登入後可查看裝備清單、食材與費用分攤。</p>
                    <button className="btn btn-primary" onClick={() => navigate('/login')}>
                        前往登入
                    </button>
                </div>
            )}

            {user && detailError && (
                <div className="card" style={{ marginBottom: 20, color: 'var(--color-error)' }}>
                    {detailError}
                </div>
            )}

            <div className="tabs">
                <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                    📋 活動資訊
                </button>
                <button className={`tab ${activeTab === 'gear' ? 'active' : ''}`} onClick={() => setActiveTab('gear')}>
                    🎒 裝備 ({gearItems.length})
                </button>
                <button className={`tab ${activeTab === 'food' ? 'active' : ''}`} onClick={() => setActiveTab('food')}>
                    🍖 食材 ({foodItems.length})
                </button>
                <button className={`tab ${activeTab === 'expense' ? 'active' : ''}`} onClick={() => setActiveTab('expense')}>
                    💰 費用 (${totalExpense})
                </button>
            </div>

            {activeTab === 'info' && (
                <div className="card">
                    <h3 style={{ marginBottom: 16 }}>📝 活動說明</h3>
                    <p style={{ color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>
                        {event.description || '無說明'}
                    </p>

                    {event.notices && (
                        <>
                            <h3 style={{ marginTop: 24, marginBottom: 16 }}>⚠️ 注意事項</h3>
                            <p style={{ color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>
                                {event.notices}
                            </p>
                        </>
                    )}

                    {event.google_map_url && (
                        <a
                            href={event.google_map_url.startsWith('http') ? event.google_map_url : `https://maps.google.com/?q=${event.google_map_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ marginTop: 20 }}
                        >
                            📍 查看地圖
                        </a>
                    )}
                </div>
            )}

            {activeTab === 'gear' && (
                <div>
                    {gearItems.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🎒</div>
                            <p>還沒有裝備清單</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {gearItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`checklist-item ${item.is_checked ? 'checked' : ''}`}
                                    onClick={() => toggleItem(item.id)}
                                >
                                    <div className={`checkbox ${item.is_checked ? 'checked' : ''}`}>
                                        {item.is_checked && '✓'}
                                    </div>
                                    <div className="item-info">
                                        <div className="item-name">{item.name}</div>
                                        <div className="item-meta">
                                            數量: {item.quantity} {item.note && `• ${item.note}`}
                                        </div>
                                    </div>
                                    {item.is_personal && <span className="badge badge-food">個人</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'food' && (
                <div>
                    {foodItems.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🍖</div>
                            <p>還沒有食材清單</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {foodItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`checklist-item ${item.is_checked ? 'checked' : ''}`}
                                    onClick={() => toggleItem(item.id)}
                                >
                                    <div className={`checkbox ${item.is_checked ? 'checked' : ''}`}>
                                        {item.is_checked && '✓'}
                                    </div>
                                    <div className="item-info">
                                        <div className="item-name">{item.name}</div>
                                        <div className="item-meta">
                                            數量: {item.quantity} {item.note && `• ${item.note}`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'expense' && (
                <div>
                    <div className="card" style={{ marginBottom: 20, textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                            ${totalExpense.toLocaleString()}
                        </div>
                        <div style={{ color: 'var(--color-text-muted)' }}>總費用</div>
                    </div>

                    {expenses.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">💰</div>
                            <p>還沒有費用紀錄</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {expenses.map(expense => (
                                <div key={expense.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{expense.description}</div>
                                            <div className="item-meta">
                                                分攤人數: {expense.split_among_ids?.length || 0}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                                            ${expense.amount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
