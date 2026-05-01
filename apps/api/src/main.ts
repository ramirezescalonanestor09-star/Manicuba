import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`Manicuba API listo en http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
