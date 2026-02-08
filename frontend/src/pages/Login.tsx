import { useNavigate } from 'react-router-dom'
import { signInWithGoogle, signInWithLine } from '../services/firebase'

export default function Login() {
    const navigate = useNavigate()

    const handleGoogle = async () => {
        const user = await signInWithGoogle()
        if (user) navigate('/')
    }

    const handleLine = async () => {
        const user = await signInWithLine()
        if (user) navigate('/')
    }

    return (
        <div className="container">
            <div className="hero" style={{ maxWidth: 400, margin: '60px auto' }}>
                <h1 className="hero-title">🔐 登入</h1>
                <p className="hero-subtitle">使用社群帳號快速登入</p>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 20, fontSize: '1.1rem' }}
                    onClick={handleGoogle}
                >
                    使用 Google 登入
                </button>

                <button
                    className="btn"
                    style={{
                        background: '#00C300',
                        color: 'white',
                        width: '100%',
                        marginTop: 12,
                        fontSize: '1.1rem',
                    }}
                    onClick={handleLine}
                >
                    使用 LINE 登入
                </button>

                <p style={{ marginTop: 20, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    登入後可以發起活動、加入揪團、分攤費用
                </p>
            </div>
        </div>
    )
}
