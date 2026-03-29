import { NestFactory } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // CORS — docs/backend/08-middlewares.md § Configuração de CORS
  app.enableCors({
    origin: process.env.WEB_CLIENT_URL
      ? [process.env.WEB_CLIENT_URL, 'http://localhost:3000']
      : 'http://localhost:3000',
    methods: 'GET,POST,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Authorization,Content-Type,X-Request-Id,X-Node-Token',
    credentials: true,
    maxAge: 86400,
  });

  app.use(cookieParser());

  // Body size limits — docs/backend/08-middlewares.md § BodyParser
  app.use(json({ limit: '10mb' }));

  // Health routes sem prefixo /api — docs/backend/05-api-contracts.md
  app.setGlobalPrefix('api', { exclude: ['health/live', 'health/ready', 'health/metrics'] });

  // Pipes, filters, interceptors — docs/backend/08-middlewares.md
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('Alexandria API')
    .setDescription(
      'API do Alexandria — sistema de armazenamento familiar distribuído com criptografia zero-knowledge.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
