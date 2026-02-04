/**
 * API Service
 * Handles all HTTP requests to the backend
 */
import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
};

// Appointments API
export const appointmentsApi = {
    getAll: async (params?: {
        search?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }) => {
        const response = await api.get('/appointments', { params });
        return response.data;
    },
    getSuggestions: async (query: string) => {
        const response = await api.get('/appointments/search-suggestions', { params: { query } });
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await api.get(`/appointments/${id}`);
        return response.data;
    },
    create: async (data: CreateAppointmentData) => {
        const response = await api.post('/appointments', data);
        return response.data;
    },
    update: async (id: string, data: Partial<CreateAppointmentData>) => {
        const response = await api.put(`/appointments/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/appointments/${id}`);
        return response.data;
    },
};

// Admin API
export const adminApi = {
    getAgents: async () => {
        const response = await api.get('/admin/agents');
        return response.data;
    },
    createAgent: async (data: CreateAgentData) => {
        const response = await api.post('/admin/agents', data);
        return response.data;
    },
    updateAgentStatus: async (id: string, is_active: boolean) => {
        const response = await api.put(`/admin/agents/${id}/status`, { is_active });
        return response.data;
    },
    getActivityLogs: async () => {
        const response = await api.get('/admin/activity-logs');
        return response.data;
    },
    triggerReport: async () => {
        const response = await api.post('/admin/jobs/trigger-report');
        return response.data;
    },
    // New: Export to custom emails
    exportToEmail: async (recipients: string[], startDate?: string, endDate?: string) => {
        const response = await api.post('/admin/jobs/export-email', {
            recipients,
            startDate,
            endDate,
        });
        return response.data;
    },
    // New: Download CSV directly
    downloadCsv: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await api.get(`/admin/jobs/export-csv?${params.toString()}`, {
            responseType: 'blob',
        });
        return response.data;
    },
    // New: Admin management
    getAdmins: async () => {
        const response = await api.get('/admin/admins');
        return response.data;
    },
    createAdmin: async (data: CreateAgentData) => {
        const response = await api.post('/admin/admins', data);
        return response.data;
    },
};

// Types
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'agent';
    is_active: boolean;
    created_at: string;
}

export interface Appointment {
    id: string;
    patient_name: string;
    test_name: string;
    branch_location: string;
    appointment_date: string;
    amount: number;
    advance_amount: number;
    balance_amount: number;
    pro_details: string | null;
    contact_number: string;
    agent_id: string;
    agent?: User;
    created_at: string;
    updated_at: string;
}

export interface ActivityLog {
    id: string;
    appointment_id: string;
    agent_id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown>;
    created_at: string;
    agent?: User;
    appointment?: Appointment;
}

export interface CreateAppointmentData {
    patient_name: string;
    test_name: string;
    branch_location: string;
    appointment_date: string;
    amount: number;
    advance_amount?: number;
    pro_details?: string;
    contact_number: string;
    agent_id?: string;
}

export interface CreateAgentData {
    name: string;
    email: string;
    password: string;
}
