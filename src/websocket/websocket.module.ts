/**
 * WebSocket Module
 * Provides real-time communication capabilities
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppointmentsGateway } from './appointments.gateway';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.secret'),
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AppointmentsGateway],
    exports: [AppointmentsGateway],
})
export class WebsocketModule { }
