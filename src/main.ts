import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';

import { AppModule } from './app.module.js';
import { required } from './common/config/env.config.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Ensures all responses match ApiResponse format
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const clientOrigin = required('CLIENT_URL');
  app.enableCors({
    origin: clientOrigin.split(',').map((origin) => origin.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  const port = process.env.PORT || '3000';
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

  await app.listen(port);
  logger.log(`🚀 Application is running on ${baseUrl}`);
}

bootstrap().catch(err => {
  logger.error('❌ Error during app bootstrap', err);
  process.exit(1);
});
