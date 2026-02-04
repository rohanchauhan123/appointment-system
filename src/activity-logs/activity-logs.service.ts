/**
 * Activity Logs Service
 * Handles audit trail operations
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActionType } from './entities/activity-log.entity';

export interface CreateLogParams {
    appointment_id: string;
    agent_id: string;
    action: ActionType;
    old_data?: Record<string, any> | null;
    new_data: Record<string, any>;
}

@Injectable()
export class ActivityLogsService {
    constructor(
        @InjectRepository(ActivityLog)
        private activityLogRepository: Repository<ActivityLog>,
    ) { }

    /**
     * Creates a new activity log entry
     * Called internally by appointments service
     */
    async create(params: CreateLogParams): Promise<ActivityLog> {
        const log = this.activityLogRepository.create({
            appointment_id: params.appointment_id,
            agent_id: params.agent_id,
            action: params.action,
            old_data: params.old_data ?? null,
            new_data: params.new_data,
        });

        return this.activityLogRepository.save(log);
    }

    /**
     * Retrieves all activity logs (admin only)
     * Includes related appointment and agent info
     */
    async findAll(): Promise<ActivityLog[]> {
        return this.activityLogRepository.find({
            relations: ['appointment', 'agent'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Retrieves logs for a specific appointment
     */
    async findByAppointmentId(appointmentId: string): Promise<ActivityLog[]> {
        return this.activityLogRepository.find({
            where: { appointment_id: appointmentId },
            relations: ['agent'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Retrieves logs by a specific agent
     */
    async findByAgentId(agentId: string): Promise<ActivityLog[]> {
        return this.activityLogRepository.find({
            where: { agent_id: agentId },
            relations: ['appointment'],
            order: { created_at: 'DESC' },
        });
    }
}
