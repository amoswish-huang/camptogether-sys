import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EventDetail from './pages/EventDetail'
import CreateEvent from './pages/CreateEvent'
import Login from './pages/Login'
import Layout from './components/Layout'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="events/:id" element={<EventDetail />} />
                <Route path="events/create" element={<CreateEvent />} />
                <Route path="login" element={<Login />} />
            </Route>
        </Routes>
    )
}

export default App
