/**
 * Appointments Controller
 * Handles appointment CRUD endpoints
 */
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { User, UserRole } from '../users/entities/user.entity';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    /**
     * GET /appointments/search-suggestions
     * Retrieves autocomplete suggestions for search
     */
    @Get('search-suggestions')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    async getSearchSuggestions(@Query('query') query: string) {
        return this.appointmentsService.getSearchSuggestions(query);
    }

    /**
     * GET /appointments
     * Retrieves all appointments with optional filters and pagination
     */
    @Get()
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    async findAll(
        @Query('search') search?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        return this.appointmentsService.findAll(
            search,
            startDate,
            endDate,
            parseInt(page, 10),
            parseInt(limit, 10),
        );
    }

    /**
     * GET /appointments/:id
     * Retrieves a specific appointment
     */
    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.appointmentsService.findOne(id);
    }

    /**
     * POST /appointments
     * Creates a new appointment
     * Automatically links to the authenticated agent
     */
    @Post()
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    async create(
        @Body() createAppointmentDto: CreateAppointmentDto,
        @CurrentUser() user: User,
    ) {
        return this.appointmentsService.create(createAppointmentDto, user);
    }

    /**
     * PUT /appointments/:id
     * Updates an existing appointment
     */
    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateAppointmentDto: UpdateAppointmentDto,
        @CurrentUser() user: User,
    ) {
        return this.appointmentsService.update(id, updateAppointmentDto, user);
    }

    /**
     * DELETE /appointments/:id
     * Deletes an appointment (Admin only)
     */
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
        return this.appointmentsService.remove(id, user);
    }
}
