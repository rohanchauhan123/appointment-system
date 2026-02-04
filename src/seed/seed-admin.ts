/**
 * Admin User Seed Script
 * Creates an initial admin user for the system
 * Run with: npm run seed:admin
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// Create a temporary data source for seeding
const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'diagnostic_center',
    synchronize: true,
    entities: ['src/**/*.entity.ts'],
});

async function seedAdmin() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const userRepository = AppDataSource.getRepository('User');

        // Check if admin already exists
        const existingAdmin = await userRepository.findOne({
            where: { email: 'admin@diagnosticcenter.com' },
        });

        if (existingAdmin) {
            console.log('Admin user already exists');
            await AppDataSource.destroy();
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        const admin = userRepository.create({
            name: 'System Admin',
            email: 'admin@diagnosticcenter.com',
            password: hashedPassword,
            role: 'admin',
            is_active: true,
        });

        await userRepository.save(admin);

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@diagnosticcenter.com');
        console.log('🔑 Password: Admin@123');
        console.log('');
        console.log('⚠️  Please change the password after first login!');

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error seeding admin:', (error as Error).message);
        process.exit(1);
    }
}

seedAdmin();
