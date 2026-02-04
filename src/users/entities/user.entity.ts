/**
 * User Entity
 * Represents both Admin and Agent users in the system
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';

export enum UserRole {
    ADMIN = 'admin',
    AGENT = 'agent',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.AGENT,
    })
    role: UserRole;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    // Relations
    @OneToMany(() => Appointment, (appointment) => appointment.agent)
    appointments: Appointment[];

    @OneToMany(() => ActivityLog, (log) => log.agent)
    activity_logs: ActivityLog[];
}
