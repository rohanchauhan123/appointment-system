/**
 * Appointments Service
 * Handles appointment CRUD operations with audit logging and real-time updates
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike, FindOptionsWhere } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';
import { User, UserRole } from '../users/entities/user.entity';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActionType } from '../activity-logs/entities/activity-log.entity';
import { AppointmentsGateway } from '../websocket/appointments.gateway';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private appointmentRepository: Repository<Appointment>,
        private activityLogsService: ActivityLogsService,
        private appointmentsGateway: AppointmentsGateway,
    ) { }

    /**
     * Creates a new appointment
     * - Logs the CREATE action
     * - Broadcasts real-time event
     */
    async create(
        createAppointmentDto: CreateAppointmentDto,
        agent: User,
    ): Promise<Appointment> {
        let assignedAgentId = agent.id;

        // If user is ADMIN and specifies agent_id, use that
        if (agent.role === UserRole.ADMIN && createAppointmentDto.agent_id) {
            assignedAgentId = createAppointmentDto.agent_id;
        }

        const appointment = this.appointmentRepository.create({
            ...createAppointmentDto,
            appointment_date: new Date(createAppointmentDto.appointment_date),
            agent_id: assignedAgentId,
        });

        const savedAppointment = await this.appointmentRepository.save(appointment);

        // Load appointment with relations for complete data
        const completeAppointment = await this.appointmentRepository.findOne({
            where: { id: savedAppointment.id },
            relations: ['agent'],
        });

        if (!completeAppointment) {
            throw new NotFoundException('Failed to load saved appointment');
        }

        // Log the CREATE action (Action performed BY 'agent', even if assigned to someone else)
        await this.activityLogsService.create({
            appointment_id: savedAppointment.id,
            agent_id: agent.id, // The actor
            action: ActionType.CREATE,
            new_data: this.sanitizeAppointment(completeAppointment),
        });

        // Broadcast real-time event
        this.appointmentsGateway.emitAppointmentCreated(completeAppointment);

        return completeAppointment;
    }

    /**
     * Updates an existing appointment
     * - Captures old data snapshot
     * - Logs the UPDATE action with both old and new data
     * - Broadcasts real-time event
     */
    async update(
        id: string,
        updateAppointmentDto: UpdateAppointmentDto,
        agent: User,
    ): Promise<Appointment> {
        const existingAppointment = await this.appointmentRepository.findOne({
            where: { id },
            relations: ['agent'],
        });

        if (!existingAppointment) {
            throw new NotFoundException(`Appointment with ID ${id} not found`);
        }

        // Capture old data snapshot before update
        const oldData = this.sanitizeAppointment(existingAppointment);

        // Apply updates
        Object.assign(existingAppointment, updateAppointmentDto);

        // Handle appointment_date if provided
        if (updateAppointmentDto.appointment_date) {
            existingAppointment.appointment_date = new Date(updateAppointmentDto.appointment_date);
        }

        const updatedAppointment = await this.appointmentRepository.save(existingAppointment);

        // Reload with relations
        const completeAppointment = await this.appointmentRepository.findOne({
            where: { id },
            relations: ['agent'],
        });

        if (!completeAppointment) {
            throw new NotFoundException('Failed to load updated appointment');
        }

        // Log the UPDATE action with old and new data
        await this.activityLogsService.create({
            appointment_id: id,
            agent_id: agent.id,
            action: ActionType.UPDATE,
            old_data: oldData,
            new_data: this.sanitizeAppointment(completeAppointment),
        });

        // Broadcast real-time event
        this.appointmentsGateway.emitAppointmentUpdated(completeAppointment);

        return completeAppointment;
    }

    /**
     * Retrieves all appointments with optional filters and pagination
     */
    async findAll(
        search?: string,
        startDate?: string,
        endDate?: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{ data: Appointment[]; total: number; page: number; totalPages: number }> {
        const skip = (page - 1) * limit;

        // Build query conditions
        let where: FindOptionsWhere<Appointment> | FindOptionsWhere<Appointment>[] = [];

        // Date filter
        const dateCondition = startDate && endDate
            ? Between(new Date(startDate), new Date(endDate))
            : undefined;

        if (search) {
            // Search in patient_name or contact_number
            where.push(
                {
                    patient_name: ILike(`%${search}%`),
                    ...(dateCondition && { created_at: dateCondition }),
                },
                {
                    contact_number: ILike(`%${search}%`),
                    ...(dateCondition && { created_at: dateCondition }),
                },
            );
        } else if (dateCondition) {
            // Only date filter
            where = { created_at: dateCondition };
        } else {
            // Default: Show only today's appointments if no filters provided
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            where = { created_at: Between(startOfDay, endOfDay) };
        }

        const [data, total] = await this.appointmentRepository.findAndCount({
            where: Array.isArray(where) && where.length === 0 ? undefined : where,
            relations: ['agent'],
            order: { created_at: 'DESC' },
            take: limit,
            skip: skip,
        });

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Retrieves a single appointment by ID
     */
    async findOne(id: string): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id },
            relations: ['agent'],
        });

        if (!appointment) {
            throw new NotFoundException(`Appointment with ID ${id} not found`);
        }

        return appointment;
    }

    /**
     * Retrieves appointments for a specific date range
     * Used by the scheduled job for daily reports
     */
    async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
        return this.appointmentRepository.find({
            where: {
                created_at: Between(startDate, endDate),
            },
            relations: ['agent'],
            order: { created_at: 'ASC' },
        });
    }

    /**
     * Retrieves today's appointments
     */
    async findTodaysAppointments(): Promise<Appointment[]> {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        return this.findByDateRange(startOfDay, endOfDay);
    }

    /**
     * Search suggestions for autocomplete (Patient Name or Phone)
     * Limited to top 5 matches
     */
    async getSearchSuggestions(query: string): Promise<{ text: string; type: 'name' | 'phone' }[]> {
        if (!query || query.length < 2) return [];

        const suggestions: { text: string; type: 'name' | 'phone' }[] = [];

        // Search names
        const names = await this.appointmentRepository.find({
            where: { patient_name: ILike(`%${query}%`) },
            select: ['patient_name'],
            take: 3,
            order: { created_at: 'DESC' },
        });
        names.forEach(n => suggestions.push({ text: n.patient_name, type: 'name' }));

        // Search phones
        const phones = await this.appointmentRepository.find({
            where: { contact_number: ILike(`%${query}%`) },
            select: ['contact_number'],
            take: 2,
            order: { created_at: 'DESC' },
        });
        phones.forEach(p => suggestions.push({ text: p.contact_number, type: 'phone' }));

        // Remove duplicates
        return Array.from(new Set(suggestions.map(s => JSON.stringify(s)))).map(s => JSON.parse(s));
    }

    /**
     * Sanitizes appointment data for logging
     * Removes circular references and sensitive data
     */
    private sanitizeAppointment(appointment: Appointment): Record<string, any> {
        const { agent, ...rest } = appointment;
        return {
            ...rest,
            agent_id: agent?.id,
            agent_name: agent?.name,
        };
    }

    /**
     * Deletes an appointment (Admin only)
     */
    async remove(id: string, adminUser: User): Promise<void> {
        const appointment = await this.findOne(id);

        // Log before delete
        await this.activityLogsService.create({
            appointment_id: id,
            agent_id: adminUser.id,
            action: ActionType.DELETE,
            old_data: this.sanitizeAppointment(appointment),
            new_data: {}, // Required by type
        });

        await this.appointmentRepository.remove(appointment);

        // Broadcast deleted event
        this.appointmentsGateway.emitAppointmentDeleted(id);
    }
}
