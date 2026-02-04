/**
 * Appointment Entity
 * Represents patient appointments with automatic balance calculation
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    BeforeInsert,
    BeforeUpdate,
    OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    patient_name: string;

    @Column({ type: 'varchar', length: 255 })
    test_name: string;

    @Column({ type: 'varchar', length: 255 })
    branch_location: string;

    @Column({ type: 'timestamp' })
    appointment_date: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    advance_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balance_amount: number;

    @Column({ type: 'text', nullable: true })
    pro_details: string;

    @Column({ type: 'varchar', length: 20 })
    contact_number: string;

    @Column({ type: 'uuid' })
    agent_id: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.appointments)
    @JoinColumn({ name: 'agent_id' })
    agent: User;

    @OneToMany(() => ActivityLog, (log) => log.appointment)
    activity_logs: ActivityLog[];

    /**
     * Auto-calculate balance before insert/update
     */
    @BeforeInsert()
    @BeforeUpdate()
    calculateBalance() {
        this.balance_amount = Number(this.amount) - Number(this.advance_amount);
    }
}
