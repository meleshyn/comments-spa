import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { Env } from './config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Get configuration service for environment-aware settings
  const configService = app.get(ConfigService<Env>);

  // Apply helmet middleware for security headers
  app.use(helmet());

  // Enable global validation using nestjs-zod
  app.useGlobalPipes(new ZodValidationPipe());

  // Enable CORS for frontend communication
  const frontendUrl = configService.get('FRONTEND_URL', { infer: true });
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = configService.get('PORT', { infer: true }) || 3000;
  await app.listen(port);

  logger.log(`🚀 API server running on port ${port}`);
  logger.log(`🔐 CORS enabled for origin: ${frontendUrl}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
