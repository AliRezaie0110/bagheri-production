import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const webOrigin =
    process.env.WEB_ORIGIN ??
    'http://localhost:3000';

  app.enableCors({
    origin: webOrigin,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  const port =
    Number(process.env.API_PORT ?? 4000);

  await app.listen(port);

  console.log(
    `Bagheri API running on http://localhost:${port}/api`,
  );
}

void bootstrap();