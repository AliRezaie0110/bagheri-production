import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { resolve } from 'node:path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './auth/guards/roles.guard';
import { SessionAuthGuard } from './auth/guards/session-auth.guard';
import { HealthModule } from './health/health.module';
import { PersonnelModule } from './personnel/personnel.module';
import { OperationsModule } from './operations/operations.module';
import { PrismaModule } from './prisma/prisma.module';

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
    PersonnelModule,
    OperationsModule,
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
    {
      provide: APP_GUARD,
      useClass:
        RolesGuard,
    },
  ],
})
export class AppModule {}