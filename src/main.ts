import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    credentials: true,
    origin: 'http://localhost:3000',
  });

  
  await app.listen(8000);
}
bootstrap();
