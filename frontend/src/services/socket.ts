/**
 * WebSocket Service
 * Handles real-time Socket.IO connection
 */
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { Appointment } from './api';

const SOCKET_URL = 'http://localhost:3000';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<(data: SocketEvent) => void>> = new Map();

    connect() {
        const token = localStorage.getItem('token');
        if (!token) return;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            query: { token },
        });

        this.socket.on('connect', () => {
            console.log('🔌 WebSocket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 WebSocket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔌 WebSocket connection error:', error.message);
        });

        // Forward events to listeners
        this.socket.on('appointment_created', (data: SocketEvent) => {
            this.notifyListeners('appointment_created', data);
        });

        this.socket.on('appointment_updated', (data: SocketEvent) => {
            this.notifyListeners('appointment_updated', data);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    subscribe(event: string, callback: (data: SocketEvent) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    private notifyListeners(event: string, data: SocketEvent) {
        this.listeners.get(event)?.forEach((callback) => callback(data));
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}

export const socketService = new SocketService();

export interface SocketEvent {
    type: 'CREATE' | 'UPDATE';
    data: Appointment;
    timestamp: string;
}
