import {
  Module,
} from '@nestjs/common';
import {
  ConfigModule,
} from '@nestjs/config';
import {
  APP_GUARD,
} from '@nestjs/core';
import {
  resolve,
} from 'node:path';

import {
  AppController,
} from './app.controller';
import {
  AppService,
} from './app.service';
import {
  AuthModule,
} from './auth/auth.module';
import {
  SessionAuthGuard,
} from './auth/guards/session-auth.guard';
import {
  HealthModule,
} from './health/health.module';
import {
  PrismaModule,
} from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(
          process.cwd(),
          '.env',
        ),
        resolve(
          process.cwd(),
          'apps/api/.env',
        ),
      ],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass:
        SessionAuthGuard,
    },
  ],
})
export class AppModule {}