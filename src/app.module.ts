/**
 * Root Application Module
 * Imports and configures all feature modules
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { WebsocketModule } from './websocket/websocket.module';
import { JobsModule } from './jobs/jobs.module';

// Entities
import { User } from './users/entities/user.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { ActivityLog } from './activity-logs/entities/activity-log.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [User, Appointment, ActivityLog],
        synchronize: configService.get<string>('nodeEnv') === 'development', // Auto-sync in dev only
        logging: configService.get<string>('nodeEnv') === 'development',
        ssl: configService.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    AppointmentsModule,
    ActivityLogsModule,
    WebsocketModule,
    JobsModule,
  ],
})
export class AppModule { }
