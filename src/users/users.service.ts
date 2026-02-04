/**
 * Users Service
 * Handles user management operations (admin functions)
 */
import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, UpdateUserStatusDto } from './dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    /**
     * Creates a new user (agent or admin)
     * Hashes password before storing
     */
    async create(createUserDto: CreateUserDto): Promise<Partial<User>> {
        const { email, password, name, role } = createUserDto;

        // Check if email already exists
        const existingUser = await this.userRepository.findOne({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = this.userRepository.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || UserRole.AGENT,
            is_active: true,
        });

        const savedUser = await this.userRepository.save(user);

        // Return user without password
        const { password: _, ...result } = savedUser;
        return result;
    }

    /**
     * Retrieves all agents (excludes admins)
     */
    async findAllAgents(): Promise<Partial<User>[]> {
        const agents = await this.userRepository.find({
            where: { role: UserRole.AGENT },
            order: { created_at: 'DESC' },
        });

        // Remove passwords from response
        return agents.map(({ password: _, ...agent }) => agent);
    }

    /**
     * Retrieves all users (admin function)
     */
    async findAll(): Promise<Partial<User>[]> {
        const users = await this.userRepository.find({
            order: { created_at: 'DESC' },
        });

        return users.map(({ password: _, ...user }) => user);
    }

    /**
     * Updates user's active status
     */
    async updateStatus(
        id: string,
        updateStatusDto: UpdateUserStatusDto,
    ): Promise<Partial<User>> {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.is_active = updateStatusDto.is_active;
        const updatedUser = await this.userRepository.save(user);

        const { password: _, ...result } = updatedUser;
        return result;
    }

    /**
     * Find user by ID
     */
    async findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email: email.toLowerCase() },
        });
    }

    /**
     * Retrieves all admin users
     */
    async findAllAdmins(): Promise<Partial<User>[]> {
        const admins = await this.userRepository.find({
            where: { role: UserRole.ADMIN },
            order: { created_at: 'DESC' },
        });

        return admins.map(({ password: _, ...admin }) => admin);
    }
}
