/**
 * Jobs Controller
 * Admin endpoints for export and report functions
 */
import { Controller, Post, Get, Body, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JobsService } from './jobs.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { UserRole } from '../users/entities/user.entity';
import { ExportReportDto } from './dto';

@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class JobsController {
    constructor(private readonly jobsService: JobsService) { }

    /**
     * POST /admin/jobs/trigger-report
     * Manually triggers the daily report generation (uses default recipients)
     */
    @Post('trigger-report')
    async triggerReport() {
        return this.jobsService.triggerManualReport();
    }

    /**
     * POST /admin/jobs/export-email
     * Exports appointments and sends to specified email addresses
     */
    @Post('export-email')
    async exportToEmail(@Body() exportDto: ExportReportDto) {
        return this.jobsService.exportWithCustomRecipients(exportDto);
    }

    /**
     * GET /admin/jobs/export-csv
     * Downloads appointments as CSV file
     */
    @Get('export-csv')
    async exportCsv(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Res() res?: Response,
    ) {
        const { csv, count } = await this.jobsService.getExportCsv(startDate, endDate);

        const today = new Date().toISOString().split('T')[0];
        const filename = `appointments_export_${today}.csv`;

        res?.setHeader('Content-Type', 'text/csv');
        res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res?.send(csv);

        return { count };
    }
}
