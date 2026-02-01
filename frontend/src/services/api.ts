import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export interface Event {
    id: string
    title: string
    description: string
    location_name: string
    location_address: string
    start_date: string
    end_date: string
    host_id: number
    attendee_ids: number[]
    invite_token: string
    is_public: boolean
    notices?: string
    cover_image?: string
    google_map_url?: string
}

export interface ChecklistItem {
    id: string
    event_id: string
    name: string
    quantity: number
    note: string
    item_type: 'GEAR' | 'FOOD'
    is_checked: boolean
    is_personal: boolean
    assigned_to_id: number | null
    claims: { user_id: number; quantity: number }[]
}

export interface Expense {
    id: string
    event_id: string
    description: string
    amount: number
    payer_id: number
    split_among_ids: number[]
}

export interface User {
    id: string
    username: string
    nickname: string
    avatar?: string
}

const api = {
    // Events
    getEvents: () => axios.get<Event[]>(`${API_BASE}/api/events`).then(r => r.data),

    getEvent: (id: string) => axios.get<Event>(`${API_BASE}/api/events/${id}`).then(r => r.data),

    createEvent: (data: Partial<Event>) =>
        axios.post<Event>(`${API_BASE}/api/events`, data).then(r => r.data),

    updateEvent: (id: string, data: Partial<Event>) =>
        axios.put<Event>(`${API_BASE}/api/events/${id}`, data).then(r => r.data),

    deleteEvent: (id: string) =>
        axios.delete(`${API_BASE}/api/events/${id}`).then(r => r.data),

    joinEvent: (id: string, userId: number) =>
        axios.post(`${API_BASE}/api/events/${id}/join`, { user_id: userId }).then(r => r.data),

    // Checklist
    getChecklist: (eventId: string) =>
        axios.get<ChecklistItem[]>(`${API_BASE}/api/events/${eventId}/checklist`).then(r => r.data),

    addChecklistItem: (eventId: string, data: Partial<ChecklistItem>) =>
        axios.post<ChecklistItem>(`${API_BASE}/api/events/${eventId}/checklist`, data).then(r => r.data),

    toggleChecklistItem: (eventId: string, itemId: string) =>
        axios.put(`${API_BASE}/api/events/${eventId}/checklist/${itemId}/toggle`).then(r => r.data),

    // Expenses
    getExpenses: (eventId: string) =>
        axios.get<Expense[]>(`${API_BASE}/api/events/${eventId}/expenses`).then(r => r.data),

    addExpense: (eventId: string, data: Partial<Expense>) =>
        axios.post<Expense>(`${API_BASE}/api/events/${eventId}/expenses`, data).then(r => r.data),

    // Users
    getUsers: () => axios.get<User[]>(`${API_BASE}/api/auth/users`).then(r => r.data),
}

export default api
