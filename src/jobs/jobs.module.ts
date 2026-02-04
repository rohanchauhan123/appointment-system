/**
 * Jobs Module
 * Handles scheduled tasks and background jobs
 */
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
    imports: [ScheduleModule.forRoot(), AppointmentsModule],
    controllers: [JobsController],
    providers: [JobsService],
    exports: [JobsService],
})
export class JobsModule { }
