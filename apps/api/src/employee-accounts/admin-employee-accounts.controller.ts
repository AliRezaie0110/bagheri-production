import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
  CreateEmployeePaymentDto,
} from './dto/create-employee-payment.dto';
import {
  ListEmployeeAccountsDto,
} from './dto/list-employee-accounts.dto';
import {
  EmployeeAccountsService,
} from './employee-accounts.service';

@Controller('admin/employee-accounts')
@Roles(UserRole.MANAGER)
export class AdminEmployeeAccountsController {
  constructor(
    private readonly accounts:
      EmployeeAccountsService,
  ) {}

  @Get()
  list(
    @Query()
    query: ListEmployeeAccountsDto,
  ) {
    return this.accounts.list(
      query,
    );
  }

  @Get(':id')
  getAccount(
    @Param('id')
    id: string,
  ) {
    return this.accounts.getAccount(
      id,
    );
  }

  @Post(':id/payments')
  recordPayment(
    @CurrentUser()
    actor: AuthenticatedUser,
    @Param('id')
    id: string,
    @Body()
    dto: CreateEmployeePaymentDto,
  ) {
    return this.accounts.recordPayment(
      actor.id,
      id,
      dto,
    );
  }
}