import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // CORS — docs/backend/08-middlewares.md § Configuração de CORS
  app.enableCors({
    origin: process.env.WEB_CLIENT_URL
      ? [process.env.WEB_CLIENT_URL, 'http://localhost:3000']
      : 'http://localhost:3000',
    methods: 'GET,POST,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Authorization,Content-Type,X-Request-Id',
    credentials: true,
    maxAge: 86400,
  });

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

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
