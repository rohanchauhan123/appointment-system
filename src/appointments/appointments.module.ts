/**
 * Appointments Module
 * Provides appointment management functionality
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment]),
        ActivityLogsModule,
        WebsocketModule,
    ],
    controllers: [AppointmentsController],
    providers: [AppointmentsService],
    exports: [AppointmentsService],
})
export class AppointmentsModule { }
