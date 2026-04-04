import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';

  if (!configService.get<string>('JWT_SECRET')) {
    throw new Error('JWT_SECRET is required for secure token signing');
  }

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.disable('x-powered-by');

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Razorpay webhook signature verification requires raw request body.
  app.use('/v1/auth/subscription/webhook/razorpay', express.raw({ type: '*/*' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  const configuredOrigins = configService.get<string>('ALLOWED_ORIGINS');
  if (isProduction && !configuredOrigins) {
    throw new Error('ALLOWED_ORIGINS is required in production');
  }

  const allowedOrigins = (configuredOrigins || 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global logging + audit interceptors
  app.useGlobalInterceptors(app.get(LoggingInterceptor), app.get(AuditInterceptor));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      disableErrorMessages: isProduction,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();

  // Swagger documentation
  if (!isProduction || configService.get('ENABLE_SWAGGER') === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Rekono API')
      .setDescription('Rekono MVP API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  if (!isProduction || configService.get('ENABLE_SWAGGER') === 'true') {
    console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  }
}

bootstrap();
