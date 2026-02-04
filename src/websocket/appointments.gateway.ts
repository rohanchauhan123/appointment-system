/**
 * WebSocket Gateway
 * Handles real-time communication for appointment updates
 */
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Appointment } from '../appointments/entities/appointment.entity';

@WebSocketGateway({
    cors: {
        origin: '*', // Configure appropriately for production
    },
})
export class AppointmentsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AppointmentsGateway.name);
    private connectedClients = new Map<string, { userId: string; email: string }>();

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
    }

    /**
     * Handles new WebSocket connections
     * Validates JWT token from handshake
     */
    async handleConnection(client: Socket) {
        try {
            const token = this.extractToken(client);

            if (!token) {
                this.logger.warn(`Client ${client.id} attempted connection without token`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('jwt.secret'),
            });

            this.connectedClients.set(client.id, {
                userId: payload.sub,
                email: payload.email,
            });

            this.logger.log(`Client connected: ${client.id} (User: ${payload.email})`);
        } catch (error) {
            this.logger.warn(`Client ${client.id} authentication failed: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            this.logger.log(`Client disconnected: ${client.id} (User: ${clientInfo.email})`);
            this.connectedClients.delete(client.id);
        }
    }

    /**
     * Extracts JWT token from socket handshake
     */
    private extractToken(client: Socket): string | null {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Also check query params for token
        const queryToken = client.handshake.query.token;
        if (typeof queryToken === 'string') {
            return queryToken;
        }

        return null;
    }

    /**
     * Broadcasts appointment created event to all connected clients
     */
    emitAppointmentCreated(appointment: Appointment) {
        this.logger.log(`Broadcasting appointment_created: ${appointment.id}`);
        this.server.emit('appointment_created', {
            type: 'CREATE',
            data: appointment,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcasts appointment updated event to all connected clients
     */
    emitAppointmentUpdated(appointment: Appointment) {
        this.logger.log(`Broadcasting appointment_updated: ${appointment.id}`);
        this.server.emit('appointment_updated', {
            type: 'UPDATE',
            data: appointment,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcasts appointment deleted event to all connected clients
     */
    emitAppointmentDeleted(id: string) {
        this.logger.log(`Broadcasting appointment_deleted: ${id}`);
        this.server.emit('appointment_deleted', {
            type: 'DELETE',
            data: { id },
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Gets count of connected clients
     */
    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }
}
