import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  BatchStatus,
  OwnerPricingType,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeBatchStatusDto } from './dto/change-batch-status.dto';
import { CreateWorkBatchDto } from './dto/create-work-batch.dto';
import { ListWorkBatchesDto } from './dto/list-work-batches.dto';

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private decimal(
    value:
      | { toString(): string }
      | null
      | undefined,
  ): string | null {
    return value?.toString() ?? null;
  }

  private pricing(
    dto: CreateWorkBatchDto,
  ) {
    if (
      dto.ownerPricingType ===
      OwnerPricingType.PER_PIECE
    ) {
      if (!dto.ownerUnitPrice) {
        throw new BadRequestException({
          code:
            'OWNER_UNIT_PRICE_REQUIRED',
          message:
            'Ø¨Ø±Ø§ÛŒ Ù‚ÛŒÙ…Øªâ€ŒÚ¯Ø°Ø§Ø±ÛŒ Ø¯Ø§Ù†Ù‡â€ŒØ§ÛŒØŒ Ù‚ÛŒÙ…Øª Ù‡Ø± Ø¹Ø¯Ø¯ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª.',
        });
      }

      if (
        dto.ownerFixedAmount !==
        undefined
      ) {
        throw new BadRequestException({
          code:
            'OWNER_FIXED_AMOUNT_NOT_ALLOWED',
          message:
            'Ø¨Ø±Ø§ÛŒ Ù‚ÛŒÙ…Øªâ€ŒÚ¯Ø°Ø§Ø±ÛŒ Ø¯Ø§Ù†Ù‡â€ŒØ§ÛŒ Ù…Ø¨Ù„Øº Ú©Ù„ Ù†Ø¨Ø§ÛŒØ¯ ÙˆØ§Ø±Ø¯ Ø´ÙˆØ¯.',
        });
      }

      return {
        ownerUnitPrice:
          dto.ownerUnitPrice,
        ownerFixedAmount:
          null,
      };
    }

    if (!dto.ownerFixedAmount) {
      throw new BadRequestException({
        code:
          'OWNER_FIXED_AMOUNT_REQUIRED',
        message:
          'Ø¨Ø±Ø§ÛŒ Ù‚ÛŒÙ…Øªâ€ŒÚ¯Ø°Ø§Ø±ÛŒ Ù…Ø¨Ù„Øº Ø«Ø§Ø¨ØªØŒ Ù…Ø¨Ù„Øº Ú©Ù„ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª.',
      });
    }

    if (
      dto.ownerUnitPrice !==
      undefined
    ) {
      throw new BadRequestException({
        code:
          'OWNER_UNIT_PRICE_NOT_ALLOWED',
        message:
          'Ø¨Ø±Ø§ÛŒ Ù…Ø¨Ù„Øº Ø«Ø§Ø¨ØªØŒ Ù‚ÛŒÙ…Øª Ø¯Ø§Ù†Ù‡â€ŒØ§ÛŒ Ù†Ø¨Ø§ÛŒØ¯ ÙˆØ§Ø±Ø¯ Ø´ÙˆØ¯.',
      });
    }

    return {
      ownerUnitPrice:
        null,
      ownerFixedAmount:
        dto.ownerFixedAmount,
    };
  }

  private async presentBatch(
    batch: {
      id: string;
      code: string;
      ownerId: string;
      modelName: string;
      totalQuantity: number;
      ownerPricingType:
        OwnerPricingType;
      ownerUnitPrice:
        | { toString(): string }
        | null;
      ownerFixedAmount:
        | { toString(): string }
        | null;
      status: BatchStatus;
      startDate: Date | null;
      completedAt:
        Date | null;
      note:
        string | null;
    },
  ) {
    const owner =
      await this.prisma.owner.findUnique({
        where: {
          id: batch.ownerId,
        },
      });

    const batchOperations =
      await this.prisma.batchOperation.findMany({
        where: {
          workBatchId:
            batch.id,
        },
      });

    const operationIds =
      batchOperations.map(
        (item) =>
          item.operationId,
      );

    const operations =
      operationIds.length
        ? await this.prisma.operation.findMany({
            where: {
              id: {
                in:
                  operationIds,
              },
            },
          })
        : [];

    const operationMap =
      new Map(
        operations.map(
          (operation) => [
            operation.id,
            operation,
          ],
        ),
      );

    return {
      id:
        batch.id,
      code:
        batch.code,
      owner: owner
        ? {
            id:
              owner.id,
            name:
              owner.name,
            isActive:
              owner.isActive,
          }
        : null,
      modelName:
        batch.modelName,
      totalQuantity:
        batch.totalQuantity,
      ownerPricingType:
        batch.ownerPricingType,
      ownerUnitPrice:
        this.decimal(
          batch.ownerUnitPrice,
        ),
      ownerFixedAmount:
        this.decimal(
          batch.ownerFixedAmount,
        ),
      status:
        batch.status,
      startDate:
        batch.startDate
          ?.toISOString() ??
        null,
      completedAt:
        batch.completedAt
          ?.toISOString() ??
        null,
      note:
        batch.note,
      operations:
        batchOperations.map(
          (item) => {
            const operation =
              operationMap.get(
                item.operationId,
              );

            return {
              batchOperationId:
                item.id,
              operationId:
                item.operationId,
              name:
                operation?.name ??
                'Unknown',
              isOperationActive:
                operation?.isActive ??
                false,
              targetQuantity:
                item.targetQuantity,
              claimedQuantity:
                item.claimedQuantity,
              approvedQuantity:
                item.approvedQuantity,
              remainingQuantity:
                Math.max(
                  0,
                  item.targetQuantity -
                    item.claimedQuantity,
                ),
            };
          },
        ),
    };
  }

  async list(
    dto: ListWorkBatchesDto,
  ) {
    const page =
      dto.page ?? 1;

    const pageSize =
      dto.pageSize ?? 30;

    const q =
      dto.q?.trim();

    const where = {
      ...(dto.ownerId
        ? {
            ownerId:
              dto.ownerId,
          }
        : {}),
      ...(dto.status
        ? {
            status:
              dto.status,
          }
        : {}),
      ...(q
        ? {
            OR: [
              {
                code: {
                  contains: q,
                  mode:
                    'insensitive' as const,
                },
              },
              {
                modelName: {
                  contains: q,
                  mode:
                    'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, batches] =
      await Promise.all([
        this.prisma.workBatch.count({
          where,
        }),

        this.prisma.workBatch.findMany({
          where,
          orderBy: {
            startDate:
              'desc',
          },
          skip:
            (page - 1) *
            pageSize,
          take:
            pageSize,
        }),
      ]);

    return {
      items:
        await Promise.all(
          batches.map(
            (batch) =>
              this.presentBatch(
                batch,
              ),
          ),
        ),
      pagination: {
        page,
        pageSize,
        total,
        totalPages:
          total === 0
            ? 0
            : Math.ceil(
                total /
                  pageSize,
              ),
      },
    };
  }

  async findOne(id: string) {
    const batch =
      await this.prisma.workBatch.findUnique({
        where: {
          id,
        },
      });

    if (!batch) {
      throw new NotFoundException({
        code:
          'BATCH_NOT_FOUND',
        message:
          'Ø³Ø±ÛŒâ€ŒÚ©Ø§Ø± Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.',
      });
    }

    return this.presentBatch(
      batch,
    );
  }

  async create(
    actorId: string,
    dto: CreateWorkBatchDto,
  ) {
    const pricing =
      this.pricing(dto);

    const operationIds =
      dto.operations.map(
        (item) =>
          item.operationId,
      );

    const uniqueIds =
      new Set(operationIds);

    if (
      uniqueIds.size !==
      operationIds.length
    ) {
      throw new BadRequestException({
        code:
          'DUPLICATE_BATCH_OPERATION',
        message:
          'ÛŒÚ© Ø¹Ù…Ù„ÛŒØ§Øª Ø¯Ø± Ø³Ø±ÛŒâ€ŒÚ©Ø§Ø± Ø¯ÙˆØ¨Ø§Ø± Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø§Ø³Øª.',
      });
    }

    try {
      const batch =
        await this.prisma.$transaction(
          async (tx) => {
            const owner =
              await tx.owner.findUnique({
                where: {
                  id:
                    dto.ownerId,
                },
              });

            if (
              !owner ||
              !owner.isActive
            ) {
              throw new BadRequestException({
                code:
                  'OWNER_NOT_ACTIVE',
                message:
                  'ØµØ§Ø­Ø¨Ú©Ø§Ø± ÙØ¹Ø§Ù„ Ù†ÛŒØ³Øª ÛŒØ§ Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.',
              });
            }

            const activeOperations =
              await tx.operation.findMany({
                where: {
                  id: {
                    in:
                      operationIds,
                  },
                  isActive:
                    true,
                },
                select: {
                  id: true,
                },
              });

            if (
              activeOperations.length !==
              operationIds.length
            ) {
              throw new BadRequestException({
                code:
                  'INVALID_BATCH_OPERATIONS',
                message:
                  'ÛŒÚ© ÛŒØ§ Ú†Ù†Ø¯ Ø¹Ù…Ù„ÛŒØ§Øª Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡ Ù…Ø¹ØªØ¨Ø± ÛŒØ§ ÙØ¹Ø§Ù„ Ù†ÛŒØ³ØªÙ†Ø¯.',
              });
            }

            const created =
              await tx.workBatch.create({
                data: {
                  code:
                    dto.code
                      .trim()
                      .toUpperCase(),
                  ownerId:
                    dto.ownerId,
                  modelName:
                    dto.modelName.trim(),
                  totalQuantity:
                    dto.totalQuantity,
                  ownerPricingType:
                    dto.ownerPricingType,
                  ownerUnitPrice:
                    pricing.ownerUnitPrice,
                  ownerFixedAmount:
                    pricing.ownerFixedAmount,
                  status:
                    BatchStatus.ACTIVE,
                  startDate:
                    dto.startDate
                      ? new Date(
                          dto.startDate,
                        )
                      : new Date(),
                  note:
                    dto.note?.trim() ||
                    null,
                },
              });

            await tx.batchOperation.createMany({
              data:
                dto.operations.map(
                  (item) => ({
                    workBatchId:
                      created.id,
                    operationId:
                      item.operationId,
                    targetQuantity:
                      item.targetQuantity ??
                      dto.totalQuantity,
                    claimedQuantity:
                      0,
                    approvedQuantity:
                      0,
                  }),
                ),
            });

            await tx.auditLog.create({
              data: {
                actorId,
                action:
                  'WORK_BATCH_CREATED',
                entityType:
                  'WorkBatch',
                entityId:
                  created.id,
                afterData: {
                  code:
                    created.code,
                  ownerId:
                    created.ownerId,
                  modelName:
                    created.modelName,
                  totalQuantity:
                    created.totalQuantity,
                  ownerPricingType:
                    created.ownerPricingType,
                  ownerUnitPrice:
                    created.ownerUnitPrice
                      ?.toString() ??
                    null,
                  ownerFixedAmount:
                    created.ownerFixedAmount
                      ?.toString() ??
                    null,
                  operations:
                    dto.operations.map(
                      (item) => ({
                        operationId:
                          item.operationId,
                        targetQuantity:
                          item.targetQuantity ??
                          dto.totalQuantity,
                      }),
                    ),
                },
              },
            });

            return created;
          },
        );

      return this.presentBatch(
        batch,
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (
          error as {
            code?: string;
          }
        ).code === 'P2002'
      ) {
        throw new ConflictException({
          code:
            'BATCH_CODE_ALREADY_EXISTS',
          message:
            'Ø§ÛŒÙ† Ú©Ø¯ Ø³Ø±ÛŒâ€ŒÚ©Ø§Ø± Ù‚Ø¨Ù„Ø§Ù‹ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª.',
        });
      }

      throw error;
    }
  }

  async changeStatus(
    actorId: string,
    id: string,
    dto: ChangeBatchStatusDto,
  ) {
    const batch =
      await this.prisma.$transaction(
        async (tx) => {
          const existing =
            await tx.workBatch.findUnique({
              where: {
                id,
              },
            });

          if (!existing) {
            throw new NotFoundException({
              code:
                'BATCH_NOT_FOUND',
              message:
                'Ø³Ø±ÛŒâ€ŒÚ©Ø§Ø± Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.',
            });
          }

          const updated =
            await tx.workBatch.update({
              where: {
                id,
              },
              data: {
                status:
                  dto.status,
                completedAt:
                  dto.status ===
                  BatchStatus.COMPLETED
                    ? new Date()
                    : null,
              },
            });

          await tx.auditLog.create({
            data: {
              actorId,
              action:
                'WORK_BATCH_STATUS_CHANGED',
              entityType:
                'WorkBatch',
              entityId:
                id,
              beforeData: {
                status:
                  existing.status,
                completedAt:
                  existing.completedAt
                    ?.toISOString() ??
                  null,
              },
              afterData: {
                status:
                  updated.status,
                completedAt:
                  updated.completedAt
                    ?.toISOString() ??
                  null,
              },
            },
          });

          return updated;
        },
      );

    return this.presentBatch(
      batch,
    );
  }
}