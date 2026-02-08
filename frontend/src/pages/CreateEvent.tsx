import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function CreateEvent() {
    const navigate = useNavigate()
    const { user, loading } = useAuth()
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        title: '',
        description: '',
        location_name: '',
        location_address: '',
        start_date: '',
        end_date: '',
        is_public: false,
    })

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login')
        }
    }, [loading, user, navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.start_date || !form.end_date) {
            alert('請填寫必要欄位')
            return
        }

        setSubmitting(true)
        try {
            const event = await api.createEvent({
                ...form,
            })
            navigate(`/events/${event.id}`)
        } catch (err) {
            alert('建立失敗，請稍後再試')
        } finally {
            setSubmitting(false)
        }
    }

    const updateForm = (field: string, value: string | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">🏕️ 發起新活動</h1>
                <p className="page-subtitle">填寫活動資訊，開始召集夥伴！</p>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 600 }}>
                <div className="form-group">
                    <label className="form-label">活動名稱 *</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="例：武陵農場露營"
                        value={form.title}
                        onChange={e => updateForm('title', e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">活動說明</label>
                    <textarea
                        className="form-input"
                        placeholder="活動簡介、注意事項..."
                        rows={4}
                        value={form.description}
                        onChange={e => updateForm('description', e.target.value)}
                    />
                </div>

                <div className="grid grid-2">
                    <div className="form-group">
                        <label className="form-label">開始日期 *</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.start_date}
                            onChange={e => updateForm('start_date', e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">結束日期 *</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.end_date}
                            onChange={e => updateForm('end_date', e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">營地名稱</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="例：武陵農場露營區"
                        value={form.location_name}
                        onChange={e => updateForm('location_name', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">營地地址</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="詳細地址或 Google Maps 連結"
                        value={form.location_address}
                        onChange={e => updateForm('location_address', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={form.is_public}
                            onChange={e => updateForm('is_public', e.target.checked)}
                        />
                        公開招募（其他人可以看到並申請加入）
                    </label>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? '建立中...' : '🎯 建立活動'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}
                        disabled={submitting}
                    >
                        取消
                    </button>
                </div>
            </form>
        </div>
    )
}
