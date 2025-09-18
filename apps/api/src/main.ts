import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { Env } from './config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  console.log(`🚀 API server running on port ${port}`);
  console.log(`🔐 CORS enabled for origin: ${frontendUrl}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
