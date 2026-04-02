import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(path: string) {
  const raw = readFileSync(path, 'utf-8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] != null) continue;
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps/api/.env'),
  resolve(__dirname, '../.env'),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    loadEnvFile(envPath);
  }
}

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
    allowedHeaders: 'Authorization,Content-Type,X-Request-Id,X-Node-Token,X-Correlation-Id',
    credentials: true,
    maxAge: 86400,
  });

  app.use(cookieParser());

  // Body size limits — docs/backend/08-middlewares.md § BodyParser
  app.use(json({ limit: '10mb' }));

  // Health routes sem prefixo /api — docs/backend/05-api-contracts.md
  app.setGlobalPrefix('api', { exclude: ['health/live', 'health/ready', 'health/metrics'] });

  // Pipes, filters, interceptors — docs/backend/08-middlewares.md
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
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
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
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
