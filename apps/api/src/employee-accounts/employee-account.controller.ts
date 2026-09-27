import {
  Controller,
  Get,
} from '@nestjs/common';

import type {
  AuthenticatedUser,
} from '../auth/auth.types';
import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import {
  Roles,
} from '../auth/decorators/roles.decorator';
import {
  UserRole,
} from '../generated/prisma/enums';
import {
  EmployeeAccountsService,
} from './employee-accounts.service';

@Controller('employee-account')
export class EmployeeAccountController {
  constructor(
    private readonly accounts:
      EmployeeAccountsService,
  ) {}

  @Get('mine')
  @Roles(
    UserRole.WORKER,
    UserRole.SUPERVISOR,
    UserRole.ASSISTANT,
  )
  mine(
    @CurrentUser()
    actor: AuthenticatedUser,
  ) {
    return this.accounts.mine(
      actor.id,
    );
  }
}