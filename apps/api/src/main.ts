import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = Number(process.env['PORT'] ?? 3333);
  await app.listen(port);
  Logger.log(`🀄 Hand Betting Game API listening on :${port}/api`);
}

bootstrap().catch((err) => {
  // Surface the error and exit non-zero so Cloud Run marks the revision unhealthy
  // instead of running a half-broken container.
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
