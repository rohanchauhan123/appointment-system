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
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('database.host');
        // Auto-enable SSL if connecting to Neon or if DB_SSL is set
        const isNeon = host?.includes('neon.tech');
        const isSslEnabled = configService.get<boolean>('database.ssl') || isNeon;

        return {
          type: 'postgres',
          host: host,
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.name'),
          entities: [User, Appointment, ActivityLog],
          synchronize: configService.get<string>('nodeEnv') === 'development',
          logging: configService.get<string>('nodeEnv') === 'development',
          ssl: isSslEnabled ? { rejectUnauthorized: false } : false,
        };
      },
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
