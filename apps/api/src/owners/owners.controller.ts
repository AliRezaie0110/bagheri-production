import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../generated/prisma/enums';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { ListOwnersDto } from './dto/list-owners.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { OwnersService } from './owners.service';

@Controller('admin/owners')
@Roles(UserRole.MANAGER)
export class OwnersController {
  constructor(
    private readonly owners:
      OwnersService,
  ) {}

  @Get()
  list(
    @Query()
    query: ListOwnersDto,
  ) {
    return this.owners.list(query);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.owners.findOne(id);
  }

  @Post()
  create(
    @CurrentUser()
    actor: AuthenticatedUser,
    @Body()
    dto: CreateOwnerDto,
  ) {
    return this.owners.create(
      actor.id,
      dto,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser()
    actor: AuthenticatedUser,
    @Param('id')
    id: string,
    @Body()
    dto: UpdateOwnerDto,
  ) {
    return this.owners.update(
      actor.id,
      id,
      dto,
    );
  }

  @Post(':id/deactivate')
  deactivate(
    @CurrentUser()
    actor: AuthenticatedUser,
    @Param('id')
    id: string,
  ) {
    return this.owners.setActive(
      actor.id,
      id,
      false,
    );
  }

  @Post(':id/activate')
  activate(
    @CurrentUser()
    actor: AuthenticatedUser,
    @Param('id')
    id: string,
  ) {
    return this.owners.setActive(
      actor.id,
      id,
      true,
    );
  }
}