/**
 * Scheduled Jobs Service
 * Handles daily CSV export and email at 11:30 PM
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Parser } from 'json2csv';
import { AppointmentsService } from '../appointments/appointments.service';
import { ExportReportDto } from './dto';

@Injectable()
export class JobsService {
    private readonly logger = new Logger(JobsService.name);
    private transporter: nodemailer.Transporter;

    constructor(
        private appointmentsService: AppointmentsService,
        private configService: ConfigService,
    ) {
        // Initialize email transporter
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('smtp.host'),
            port: this.configService.get<number>('smtp.port'),
            secure: false, // TLS
            auth: {
                user: this.configService.get<string>('smtp.user'),
                pass: this.configService.get<string>('smtp.pass'),
            },
        });
    }

    /**
     * Daily job running at 11:30 PM
     * Generates CSV of today's appointments and sends via email
     */
    @Cron('30 23 * * *') // 11:30 PM every day
    async handleDailyReport() {
        this.logger.log('Starting daily appointment report generation...');

        try {
            const appointments = await this.appointmentsService.findTodaysAppointments();

            if (appointments.length === 0) {
                this.logger.log('No appointments found for today. Skipping report.');
                return;
            }

            const csv = this.generateCsv(appointments);
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const filename = `appointments_report_${dateStr}.csv`;

            const recipients = this.configService.get<string[]>('reportRecipients') || [];
            await this.sendReportEmail(csv, filename, appointments.length, recipients);

            this.logger.log(`Daily report sent successfully with ${appointments.length} appointments`);
        } catch (error: any) {
            this.logger.error('Failed to generate/send daily report:', error.message);
        }
    }

    /**
     * Generates CSV from appointments data
     */
    generateCsv(appointments: any[]): string {
        const fields = [
            { label: 'ID', value: 'id' },
            { label: 'Patient Name', value: 'patient_name' },
            { label: 'Test Name', value: 'test_name' },
            { label: 'Branch Location', value: 'branch_location' },
            { label: 'Appointment Date', value: 'appointment_date' },
            { label: 'Amount', value: 'amount' },
            { label: 'Advance Amount', value: 'advance_amount' },
            { label: 'Balance Amount', value: 'balance_amount' },
            { label: 'Contact Number', value: 'contact_number' },
            { label: 'Pro Details', value: 'pro_details' },
            { label: 'Agent Name', value: 'agent.name' },
            { label: 'Created At', value: 'created_at' },
        ];

        const parser = new Parser({ fields });
        return parser.parse(appointments);
    }

    /**
     * Sends report email with CSV attachment
     */
    async sendReportEmail(
        csvContent: string,
        filename: string,
        appointmentCount: number,
        recipients: string[],
    ): Promise<void> {
        if (!recipients || recipients.length === 0) {
            this.logger.warn('No report recipients provided. Skipping email.');
            return;
        }

        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const mailOptions: nodemailer.SendMailOptions = {
            from: this.configService.get<string>('smtp.from'),
            to: recipients.join(', '),
            subject: `Appointments Report - ${today}`,
            html: `
        <h2>Appointments Report</h2>
        <p><strong>Date:</strong> ${today}</p>
        <p><strong>Total Appointments:</strong> ${appointmentCount}</p>
        <br>
        <p>Please find the detailed report attached.</p>
        <br>
        <p>This is an automated email from the Diagnostic Center Appointment System.</p>
      `,
            attachments: [
                {
                    filename,
                    content: csvContent,
                    contentType: 'text/csv',
                },
            ],
        };

        await this.transporter.sendMail(mailOptions);
    }

    /**
     * Manual trigger for testing (uses default recipients)
     */
    async triggerManualReport(): Promise<{ message: string; count: number }> {
        this.logger.log('Manual report trigger requested');

        const appointments = await this.appointmentsService.findTodaysAppointments();

        if (appointments.length === 0) {
            return { message: 'No appointments found for today', count: 0 };
        }

        const csv = this.generateCsv(appointments);
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `appointments_report_${dateStr}.csv`;

        const recipients = this.configService.get<string[]>('reportRecipients') || [];
        await this.sendReportEmail(csv, filename, appointments.length, recipients);

        return {
            message: 'Report generated and sent successfully',
            count: appointments.length,
        };
    }

    /**
     * Export with custom recipients (allows admin to specify emails)
     */
    async exportWithCustomRecipients(exportDto: ExportReportDto): Promise<{ message: string; count: number; sentTo: string[] }> {
        this.logger.log(`Export requested to: ${exportDto.recipients.join(', ')}`);

        let appointments;
        if (exportDto.startDate && exportDto.endDate) {
            appointments = await this.appointmentsService.findByDateRange(
                new Date(exportDto.startDate),
                new Date(exportDto.endDate),
            );
        } else {
            appointments = await this.appointmentsService.findAll();
        }

        if (appointments.length === 0) {
            return { message: 'No appointments found', count: 0, sentTo: [] };
        }

        const csv = this.generateCsv(appointments);
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `appointments_export_${dateStr}.csv`;

        await this.sendReportEmail(csv, filename, appointments.length, exportDto.recipients);

        return {
            message: 'Report exported and sent successfully',
            count: appointments.length,
            sentTo: exportDto.recipients,
        };
    }

    /**
     * Get CSV content for download (without sending email)
     */
    async getExportCsv(startDate?: string, endDate?: string): Promise<{ csv: string; count: number }> {
        let appointments;
        if (startDate && endDate) {
            appointments = await this.appointmentsService.findByDateRange(
                new Date(startDate),
                new Date(endDate),
            );
        } else {
            appointments = await this.appointmentsService.findAll();
        }

        const csv = this.generateCsv(appointments);
        return { csv, count: appointments.length };
    }
}
