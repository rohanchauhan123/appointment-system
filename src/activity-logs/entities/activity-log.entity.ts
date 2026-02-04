/**
 * Activity Log Entity
 * Tracks all CREATE/UPDATE/DELETE actions on appointments
 * Stores complete snapshots of old and new data for audit trail
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum ActionType {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

@Entity('activity_logs')
export class ActivityLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    appointment_id: string;

    @Column({ type: 'uuid' })
    agent_id: string;

    @Column({
        type: 'enum',
        enum: ActionType,
    })
    action: ActionType;

    @Column({ type: 'jsonb', nullable: true })
    old_data: Record<string, any> | null;

    @Column({ type: 'jsonb' })
    new_data: Record<string, any>;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    // Relations
    @ManyToOne(() => Appointment, (appointment) => appointment.activity_logs, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'appointment_id' })
    appointment: Appointment;

    @ManyToOne(() => User, (user) => user.activity_logs)
    @JoinColumn({ name: 'agent_id' })
    agent: User;
}
