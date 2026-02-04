/**
 * Database Reset Script
 * WARNING: This script deletes ALL data from the database!
 * Use with caution, especially on production.
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../users/entities/user.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Handle Neon SSL
    entities: [User, Appointment, ActivityLog], // Explicit entities for cleaner run
    synchronize: true,
});

async function resetDatabase() {
    try {
        console.log('🔌 Connecting to database...');
        console.log(`Target Host: ${process.env.DB_HOST}`);

        await AppDataSource.initialize();
        console.log('✅ Connected!');

        console.log('⚠️  DELETING ALL DATA...');

        // Order matters for foreign keys
        const activityRepo = AppDataSource.getRepository(ActivityLog);
        const appointmentRepo = AppDataSource.getRepository(Appointment);
        const userRepo = AppDataSource.getRepository(User);

        // Delete in order: Child -> Parent
        await activityRepo.delete({}); // Clear logs first
        console.log(' - Activity Logs cleared');

        await appointmentRepo.delete({}); // Clear appointments
        console.log(' - Appointments cleared');

        await userRepo.delete({}); // Clear users (Agents/Admins)
        console.log(' - Users cleared');

        console.log('🌱 Seeding Admin...');

        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        const admin = userRepo.create({
            name: 'System Admin',
            email: 'admin@diagnosticcenter.com',
            password: hashedPassword,
            role: UserRole.ADMIN,
            is_active: true,
        });

        await userRepo.save(admin);

        console.log('✅ Database reset complete!');
        console.log('------------------------------------------------');
        console.log('🆕 Admin Credentials:');
        console.log('   Email: admin@diagnosticcenter.com');
        console.log('   Pass:  Admin@123');
        console.log('------------------------------------------------');

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
}

resetDatabase();
