/**
 * Activity Logs Controller
 * Admin endpoints for viewing audit logs
 */
import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin/activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ActivityLogsController {
    constructor(private readonly activityLogsService: ActivityLogsService) { }

    /**
     * GET /admin/activity-logs
     * Retrieves all activity logs (admin only)
     */
    @Get()
    async findAll() {
        return this.activityLogsService.findAll();
    }

    /**
     * GET /admin/activity-logs/appointment/:id
     * Retrieves logs for a specific appointment
     */
    @Get('appointment/:id')
    async findByAppointment(@Param('id', ParseUUIDPipe) id: string) {
        return this.activityLogsService.findByAppointmentId(id);
    }

    /**
     * GET /admin/activity-logs/agent/:id
     * Retrieves logs for a specific agent
     */
    @Get('agent/:id')
    async findByAgent(@Param('id', ParseUUIDPipe) id: string) {
        return this.activityLogsService.findByAgentId(id);
    }
}
