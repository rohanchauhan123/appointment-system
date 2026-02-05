/**
 * Application Bootstrap
 * Initializes the NestJS application with validation, CORS, and Socket.IO
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;

  // Enable CORS for API and WebSocket
  app.enableCors({
    origin: '*', // Configure appropriately for production
    credentials: true,
  });

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Listen on 0.0.0.0 to accept external connections (required for Render)
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: ${await app.getUrl()}/api`);
  logger.log(`📡 WebSocket server is initialized`);
  logger.log(`📧 Daily report scheduled for 11:30 PM`);
}

bootstrap();
