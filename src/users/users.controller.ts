/**
 * Users Controller
 * Admin endpoints for managing agents and admins
 */
import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { UserRole } from './entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * POST /admin/agents
     * Creates a new agent (admin only)
     */
    @Post('agents')
    async createAgent(@Body() createUserDto: CreateUserDto) {
        createUserDto.role = UserRole.AGENT;
        return this.usersService.create(createUserDto);
    }

    /**
     * GET /admin/agents
     * Retrieves all agents (admin only)
     */
    @Get('agents')
    async getAllAgents() {
        return this.usersService.findAllAgents();
    }

    /**
     * PUT /admin/agents/:id/status
     * Toggles agent active status (admin only)
     */
    @Put('agents/:id/status')
    async updateAgentStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateStatusDto: UpdateUserStatusDto,
    ) {
        return this.usersService.updateStatus(id, updateStatusDto);
    }

    /**
     * POST /admin/admins
     * Creates a new admin user (admin only)
     */
    @Post('admins')
    async createAdmin(@Body() createUserDto: CreateUserDto) {
        createUserDto.role = UserRole.ADMIN;
        return this.usersService.create(createUserDto);
    }

    /**
     * GET /admin/admins
     * Retrieves all admin users
     */
    @Get('admins')
    async getAllAdmins() {
        return this.usersService.findAllAdmins();
    }
}
