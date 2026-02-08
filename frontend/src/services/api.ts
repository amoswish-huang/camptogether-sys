import axios from 'axios'
import { getAuthToken } from './firebase'

const API_BASE = import.meta.env.VITE_API_URL || ''

export interface Event {
    id: string
    title: string
    description: string
    location_name: string
    location_address: string
    start_date: string
    end_date: string
    host_id: string
    attendee_ids?: string[]
    invite_token?: string
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
    assigned_to_id: string | null
    claims: { user_id: string; quantity: number }[]
}

export interface Expense {
    id: string
    event_id: string
    description: string
    amount: number
    payer_id: string
    split_among_ids: string[]
}

export interface UserProfile {
    id: string
    uid: string
    email: string
    display_name: string
    photo_url?: string
    roles: string[]
}

export interface ApiList<T> {
    items: T[]
    next_cursor: string | null
}

const client = axios.create({
    baseURL: API_BASE,
})

client.interceptors.request.use(async (config) => {
    const token = await getAuthToken()
    if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

const unwrapList = <T>(data: ApiList<T> | T[]): ApiList<T> => {
    if (Array.isArray(data)) {
        return { items: data, next_cursor: null }
    }
    return data
}

const api = {
    // Auth
    getMe: () => client.get<UserProfile>(`/api/auth/me`).then(r => r.data),

    // Events
    getEvents: (params?: { limit?: number; cursor?: string; scope?: 'mine'; search?: string }) =>
        client.get<ApiList<Event> | Event[]>(`/api/events`, { params }).then(r => unwrapList(r.data)),

    getEvent: (id: string) => client.get<Event>(`/api/events/${id}`).then(r => r.data),

    getAdminEvents: () => client.get<Event[]>(`/api/events/admin/all`).then(r => r.data),

    createEvent: (data: Partial<Event>) =>
        client.post<Event>(`/api/events`, data).then(r => r.data),

    updateEvent: (id: string, data: Partial<Event>) =>
        client.put<Event>(`/api/events/${id}`, data).then(r => r.data),

    deleteEvent: (id: string) =>
        client.delete(`/api/events/${id}`).then(r => r.data),

    joinEvent: (id: string) =>
        client.post(`/api/events/${id}/join`).then(r => r.data),

    // Checklist
    getChecklist: (eventId: string) =>
        client.get<ChecklistItem[]>(`/api/events/${eventId}/checklist`).then(r => r.data),

    addChecklistItem: (eventId: string, data: Partial<ChecklistItem>) =>
        client.post<ChecklistItem>(`/api/events/${eventId}/checklist`, data).then(r => r.data),

    toggleChecklistItem: (eventId: string, itemId: string) =>
        client.put(`/api/events/${eventId}/checklist/${itemId}/toggle`).then(r => r.data),

    // Expenses
    getExpenses: (eventId: string) =>
        client.get<Expense[]>(`/api/events/${eventId}/expenses`).then(r => r.data),

    addExpense: (eventId: string, data: Partial<Expense>) =>
        client.post<Expense>(`/api/events/${eventId}/expenses`, data).then(r => r.data),

    // Users
    getUsers: (params?: { limit?: number; cursor?: string }) =>
        client.get<ApiList<UserProfile> | UserProfile[]>(`/api/auth/users`, { params }).then(r => unwrapList(r.data)),
}

export default api
