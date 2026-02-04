/**
 * Auth Service
 * Handles user authentication and JWT token generation
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    /**
     * Validates user credentials and returns JWT token
     */
    async login(loginDto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
        const { email, password } = loginDto;

        // Find user by email
        const user = await this.userRepository.findOne({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new UnauthorizedException('Your account has been deactivated');
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Generate JWT token
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const access_token = this.jwtService.sign(payload);

        // Return token and user info (excluding password)
        const { password: _, ...userWithoutPassword } = user;

        return {
            access_token,
            user: userWithoutPassword,
        };
    }

    /**
     * Validates if a user exists and is active
     */
    async validateUser(userId: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id: userId, is_active: true },
        });
    }
}
