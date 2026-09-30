import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ApprovalStatus,
  BatchStatus,
  CompensationType,
  UserRole,
} from '../generated/prisma/enums';
import {
  PrismaService,
} from '../prisma/prisma.service';
import {
  SmsService,
} from '../auth/sms.service';
import {
  CreateWorkEntryDto,
} from './dto/create-work-entry.dto';
import {
  ReviewWorkEntryDto,
} from './dto/review-work-entry.dto';

@Injectable()
export class WorkEntriesService {
  constructor(
    private readonly prisma:
      PrismaService,
    private readonly sms:
      SmsService,
  ) {}

  private today(): Date {
    const now =
      new Date();

    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      ),
    );
  }

  private money(
    value:
      | {
          toString(): string;
        }
      | string
      | null
      | undefined,
  ): string | null {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    return value.toString();
  }

  private errorMessage(
    error: unknown,
  ): string {
    if (
      error instanceof Error
    ) {
      return error.message;
    }

    return 'SMS_SEND_FAILED';
  }

  private async safeSmsAudit(
    actorId: string,
    workEntryId: string,
    action: string,
    data: Record<
      string,
      string | number | boolean | null
    >,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action,
          entityType:
            'WorkEntry',
          entityId:
            workEntryId,
          afterData:
            data,
        },
      });
    } catch {
      // SMS audit failure must never
      // revert an already approved job.
    }
  }

  async available(
    workerId: string,
  ) {
    const worker =
      await this.prisma.user.findUnique({
        where: {
          id:
            workerId,
        },
      });

    if (
      !worker ||
      !worker.isActive ||
      worker.role !==
        UserRole.WORKER ||
      worker.compensationType !==
        CompensationType.PIECE_RATE
    ) {
      throw new BadRequestException({
        code:
          'WORKER_NOT_ELIGIBLE',
        message:
          'کاربر امکان ثبت کار دانه‌ای را ندارد.',
      });
    }

    const batchOperations =
      await this.prisma.batchOperation.findMany({
        where: {
          workBatch: {
            status:
              BatchStatus.ACTIVE,
          },
        },
        include: {
          operation:
            true,
          workBatch:
            true,
        },
        orderBy: {
          createdAt:
            'asc',
        },
      });

    const items =
      batchOperations.map(
        (item) => ({
          batchOperationId:
            item.id,
          batchId:
            item.workBatchId,
          batchCode:
            item.workBatch.code,
          modelName:
            item.workBatch.modelName,
          operationId:
            item.operationId,
          operationName:
            item.operation.name,
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
        }),
      );

    return {
      items:
        items.filter(
          (item) =>
            item.remainingQuantity >
            0,
        ),
    };
  }

  async create(
    workerId: string,
    dto: CreateWorkEntryDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const worker =
          await tx.user.findUnique({
            where: {
              id:
                workerId,
            },
          });

        if (
          !worker ||
          !worker.isActive ||
          worker.role !==
            UserRole.WORKER ||
          worker.compensationType !==
            CompensationType.PIECE_RATE
        ) {
          throw new BadRequestException({
            code:
              'WORKER_NOT_ELIGIBLE',
            message:
              'کاربر امکان ثبت کار دانه‌ای را ندارد.',
          });
        }

        const locked =
          await tx.$queryRaw<
            Array<{
              id: string;
            }>
          >`
            SELECT "id"
            FROM "BatchOperation"
            WHERE "id" = ${dto.batchOperationId}
            FOR UPDATE
          `;

        if (
          locked.length !== 1
        ) {
          throw new NotFoundException({
            code:
              'BATCH_OPERATION_NOT_FOUND',
            message:
              'عملیات سری‌کار پیدا نشد.',
          });
        }

        const batchOperation =
          await tx.batchOperation.findUnique({
            where: {
              id:
                dto.batchOperationId,
            },
            include: {
              operation:
                true,
              workBatch:
                true,
            },
          });

        if (!batchOperation) {
          throw new NotFoundException({
            code:
              'BATCH_OPERATION_NOT_FOUND',
            message:
              'عملیات سری‌کار پیدا نشد.',
          });
        }

        if (
          batchOperation.workBatch.status !==
          BatchStatus.ACTIVE
        ) {
          throw new ConflictException({
            code:
              'BATCH_NOT_ACTIVE',
            message:
              'این سری‌کار فعال نیست.',
          });
        }

        const remainingQuantity =
          batchOperation.targetQuantity -
          batchOperation.claimedQuantity;

        if (
          dto.quantity >
          remainingQuantity
        ) {
          throw new ConflictException({
            code:
              'WORK_QUANTITY_EXCEEDS_REMAINING',
            message:
              'تعداد ثبت‌شده بیشتر از ظرفیت باقی‌مانده است.',
            availableQuantity:
              Math.max(
                0,
                remainingQuantity,
              ),
          });
        }

        const today =
          this.today();

        const rate =
          await tx.operationRate.findFirst({
            where: {
              operationId:
                batchOperation.operationId,
              effectiveFrom: {
                lte:
                  today,
              },
              OR: [
                {
                  effectiveTo:
                    null,
                },
                {
                  effectiveTo: {
                    gte:
                      today,
                  },
                },
              ],
            },
            orderBy: {
              effectiveFrom:
                'desc',
            },
          });

        if (!rate) {
          throw new BadRequestException({
            code:
              'OPERATION_RATE_NOT_FOUND',
            message:
              'برای این عملیات نرخ فعال تعریف نشده است.',
          });
        }

        const unitRate =
          rate.amount.toString();

        const totalAmount =
          (
            BigInt(unitRate) *
            BigInt(
              dto.quantity,
            )
          ).toString();

        const entry =
          await tx.workEntry.create({
            data: {
              workerId,
              batchOperationId:
                batchOperation.id,
              quantity:
                dto.quantity,
              unitRate,
              totalAmount,
              status:
                ApprovalStatus.PENDING,
              workerNote:
                dto.workerNote
                  ?.trim() ||
                null,
            },
          });

        await tx.batchOperation.update({
          where: {
            id:
              batchOperation.id,
          },
          data: {
            claimedQuantity: {
              increment:
                dto.quantity,
            },
          },
        });

        await tx.auditLog.create({
          data: {
            actorId:
              workerId,
            action:
              'WORK_ENTRY_CREATED',
            entityType:
              'WorkEntry',
            entityId:
              entry.id,
            afterData: {
              batchOperationId:
                batchOperation.id,
              workBatchId:
                batchOperation.workBatchId,
              batchCode:
                batchOperation.workBatch.code,
              operationId:
                batchOperation.operationId,
              operationName:
                batchOperation.operation.name,
              quantity:
                dto.quantity,
              unitRate,
              totalAmount,
              status:
                ApprovalStatus.PENDING,
            },
          },
        });

        return {
          id:
            entry.id,
          batchOperationId:
            entry.batchOperationId,
          batchId:
            batchOperation.workBatchId,
          batchCode:
            batchOperation.workBatch.code,
          modelName:
            batchOperation.workBatch.modelName,
          operationId:
            batchOperation.operationId,
          operationName:
            batchOperation.operation.name,
          quantity:
            entry.quantity,
          unitRate:
            entry.unitRate.toString(),
          totalAmount:
            entry.totalAmount.toString(),
          status:
            entry.status,
          workerNote:
            entry.workerNote,
          createdAt:
            entry.createdAt.toISOString(),
          remainingQuantity:
            remainingQuantity -
            dto.quantity,
        };
      },
    );
  }

  async mine(
    workerId: string,
  ) {
    const entries =
      await this.prisma.workEntry.findMany({
        where: {
          workerId,
        },
        include: {
          batchOperation: {
            include: {
              operation:
                true,
              workBatch:
                true,
            },
          },
        },
        orderBy: {
          createdAt:
            'desc',
        },
      });

    return {
      items:
        entries.map(
          (entry) => ({
            id:
              entry.id,
            batchOperationId:
              entry.batchOperationId,
            batchId:
              entry.batchOperation
                .workBatchId,
            batchCode:
              entry.batchOperation
                .workBatch.code,
            modelName:
              entry.batchOperation
                .workBatch.modelName,
            operationId:
              entry.batchOperation
                .operationId,
            operationName:
              entry.batchOperation
                .operation.name,
            quantity:
              entry.quantity,
            unitRate:
              entry.unitRate.toString(),
            totalAmount:
              entry.totalAmount.toString(),
            status:
              entry.status,
            workerNote:
              entry.workerNote,
            reviewerNote:
              entry.reviewerNote,
            reviewedAt:
              entry.reviewedAt
                ?.toISOString() ??
              null,
            createdAt:
              entry.createdAt
                .toISOString(),
          }),
        ),
    };
  }

  async pending(
    reviewerRole: string,
  ) {
    const entries =
      await this.prisma.workEntry.findMany({
        where: {
          status:
            ApprovalStatus.PENDING,
        },
        include: {
          worker: {
            select: {
              id:
                true,
              fullName:
                true,
            },
          },
          batchOperation: {
            include: {
              operation:
                true,
              workBatch:
                true,
            },
          },
        },
        orderBy: {
          createdAt:
            'asc',
        },
      });

    return {
      items:
        entries.map(
          (entry) => {
            const base = {
              id:
                entry.id,
              worker: {
                id:
                  entry.worker.id,
                fullName:
                  entry.worker.fullName,
              },
              batchOperationId:
                entry.batchOperationId,
              batchId:
                entry.batchOperation
                  .workBatchId,
              batchCode:
                entry.batchOperation
                  .workBatch.code,
              modelName:
                entry.batchOperation
                  .workBatch.modelName,
              operationId:
                entry.batchOperation
                  .operationId,
              operationName:
                entry.batchOperation
                  .operation.name,
              quantity:
                entry.quantity,
              workerNote:
                entry.workerNote,
              status:
                entry.status,
              createdAt:
                entry.createdAt
                  .toISOString(),
              targetQuantity:
                entry.batchOperation
                  .targetQuantity,
              claimedQuantity:
                entry.batchOperation
                  .claimedQuantity,
              approvedQuantity:
                entry.batchOperation
                  .approvedQuantity,
              remainingQuantity:
                Math.max(
                  0,
                  entry.batchOperation
                    .targetQuantity -
                    entry.batchOperation
                      .claimedQuantity,
                ),
            };

            if (
              reviewerRole ===
              UserRole.MANAGER
            ) {
              return {
                ...base,
                unitRate:
                  entry.unitRate
                    .toString(),
                totalAmount:
                  entry.totalAmount
                    .toString(),
              };
            }

            return base;
          },
        ),
    };
  }

  async approve(
    reviewerId: string,
    reviewerRole: string,
    id: string,
    dto: ReviewWorkEntryDto,
  ) {
    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const lockedEntry =
            await tx.$queryRaw<
              Array<{
                id: string;
              }>
            >`
              SELECT "id"
              FROM "WorkEntry"
              WHERE "id" = ${id}
              FOR UPDATE
            `;

          if (
            lockedEntry.length !==
            1
          ) {
            throw new NotFoundException({
              code:
                'WORK_ENTRY_NOT_FOUND',
              message:
                'ثبت کار پیدا نشد.',
            });
          }

          const entry =
            await tx.workEntry.findUnique({
              where: {
                id,
              },
              include: {
                worker:
                  true,
                batchOperation: {
                  include: {
                    operation:
                      true,
                    workBatch:
                      true,
                  },
                },
              },
            });

          if (!entry) {
            throw new NotFoundException({
              code:
                'WORK_ENTRY_NOT_FOUND',
              message:
                'ثبت کار پیدا نشد.',
            });
          }

          if (
            entry.status !==
            ApprovalStatus.PENDING
          ) {
            throw new ConflictException({
              code:
                'WORK_ENTRY_ALREADY_REVIEWED',
              message:
                'این ثبت کار قبلاً بررسی شده است.',
            });
          }

          await tx.$queryRaw<
            Array<{
              id: string;
            }>
          >`
            SELECT "id"
            FROM "BatchOperation"
            WHERE "id" = ${entry.batchOperationId}
            FOR UPDATE
          `;

          const updated =
            await tx.workEntry.update({
              where: {
                id,
              },
              data: {
                status:
                  ApprovalStatus.APPROVED,
                reviewerNote:
                  dto.reviewerNote
                    ?.trim() ||
                  null,
                reviewedById:
                  reviewerId,
                reviewedAt:
                  new Date(),
              },
            });

          await tx.batchOperation.update({
            where: {
              id:
                entry.batchOperationId,
            },
            data: {
              approvedQuantity: {
                increment:
                  entry.quantity,
              },
            },
          });

          await tx.auditLog.create({
            data: {
              actorId:
                reviewerId,
              action:
                'WORK_ENTRY_APPROVED',
              entityType:
                'WorkEntry',
              entityId:
                entry.id,
              beforeData: {
                status:
                  entry.status,
              },
              afterData: {
                status:
                  ApprovalStatus.APPROVED,
                quantity:
                  entry.quantity,
                reviewerNote:
                  updated.reviewerNote,
              },
            },
          });

          return {
            entryId:
              entry.id,
            workerId:
              entry.workerId,
            workerName:
              entry.worker.fullName,
            workerPhone:
              entry.worker.phone,
            batchCode:
              entry.batchOperation
                .workBatch.code,
            batchId:
              entry.batchOperation
                .workBatchId,
            batchOperationId:
              entry.batchOperationId,
            operationId:
              entry.batchOperation
                .operationId,
            operationName:
              entry.batchOperation
                .operation.name,
            quantity:
              entry.quantity,
            unitRate:
              entry.unitRate.toString(),
            totalAmount:
              entry.totalAmount.toString(),
            workerNote:
              entry.workerNote,
            reviewerNote:
              updated.reviewerNote,
            reviewedAt:
              updated.reviewedAt
                ?.toISOString() ??
              null,
          };
        },
      );

    let smsStatus:
      'sent' |
      'failed' |
      'not_applicable' =
        'not_applicable';

    if (
      reviewerRole ===
      UserRole.SUPERVISOR
    ) {
      try {
        await this.sms.sendWorkApproval(
          result.workerPhone,
          result.batchCode,
          result.totalAmount,
        );

        smsStatus =
          'sent';

        await this.safeSmsAudit(
          reviewerId,
          result.entryId,
          'WORK_APPROVAL_SMS_SENT',
          {
            batchCode:
              result.batchCode,
            templateConfigured:
              true,
          },
        );
      } catch (error) {
        smsStatus =
          'failed';

        await this.safeSmsAudit(
          reviewerId,
          result.entryId,
          'WORK_APPROVAL_SMS_FAILED',
          {
            batchCode:
              result.batchCode,
            error:
              this.errorMessage(
                error,
              ),
          },
        );
      }
    }

    const base = {
      id:
        result.entryId,
      worker: {
        id:
          result.workerId,
        fullName:
          result.workerName,
      },
      batchId:
        result.batchId,
      batchCode:
        result.batchCode,
      batchOperationId:
        result.batchOperationId,
      operationId:
        result.operationId,
      operationName:
        result.operationName,
      quantity:
        result.quantity,
      status:
        ApprovalStatus.APPROVED,
      workerNote:
        result.workerNote,
      reviewerNote:
        result.reviewerNote,
      reviewedAt:
        result.reviewedAt,
      smsStatus,
    };

    if (
      reviewerRole ===
      UserRole.MANAGER
    ) {
      return {
        ...base,
        unitRate:
          result.unitRate,
        totalAmount:
          result.totalAmount,
      };
    }

    return base;
  }

  async reject(
    reviewerId: string,
    reviewerRole: string,
    id: string,
    dto: ReviewWorkEntryDto,
  ) {
    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const lockedEntry =
            await tx.$queryRaw<
              Array<{
                id: string;
              }>
            >`
              SELECT "id"
              FROM "WorkEntry"
              WHERE "id" = ${id}
              FOR UPDATE
            `;

          if (
            lockedEntry.length !==
            1
          ) {
            throw new NotFoundException({
              code:
                'WORK_ENTRY_NOT_FOUND',
              message:
                'ثبت کار پیدا نشد.',
            });
          }

          const entry =
            await tx.workEntry.findUnique({
              where: {
                id,
              },
              include: {
                worker:
                  true,
                batchOperation: {
                  include: {
                    operation:
                      true,
                    workBatch:
                      true,
                  },
                },
              },
            });

          if (!entry) {
            throw new NotFoundException({
              code:
                'WORK_ENTRY_NOT_FOUND',
              message:
                'ثبت کار پیدا نشد.',
            });
          }

          if (
            entry.status !==
            ApprovalStatus.PENDING
          ) {
            throw new ConflictException({
              code:
                'WORK_ENTRY_ALREADY_REVIEWED',
              message:
                'این ثبت کار قبلاً بررسی شده است.',
            });
          }

          await tx.$queryRaw<
            Array<{
              id: string;
            }>
          >`
            SELECT "id"
            FROM "BatchOperation"
            WHERE "id" = ${entry.batchOperationId}
            FOR UPDATE
          `;

          const batchOperation =
            await tx.batchOperation.findUnique({
              where: {
                id:
                  entry.batchOperationId,
              },
            });

          if (!batchOperation) {
            throw new NotFoundException({
              code:
                'BATCH_OPERATION_NOT_FOUND',
              message:
                'عملیات سری‌کار پیدا نشد.',
            });
          }

          if (
            batchOperation.claimedQuantity <
            entry.quantity
          ) {
            throw new ConflictException({
              code:
                'CLAIMED_QUANTITY_INCONSISTENT',
              message:
                'مقدار رزرو شده با ثبت کار سازگار نیست.',
            });
          }

          const updated =
            await tx.workEntry.update({
              where: {
                id,
              },
              data: {
                status:
                  ApprovalStatus.REJECTED,
                reviewerNote:
                  dto.reviewerNote
                    ?.trim() ||
                  null,
                reviewedById:
                  reviewerId,
                reviewedAt:
                  new Date(),
              },
            });

          await tx.batchOperation.update({
            where: {
              id:
                entry.batchOperationId,
            },
            data: {
              claimedQuantity: {
                decrement:
                  entry.quantity,
              },
            },
          });

          await tx.auditLog.create({
            data: {
              actorId:
                reviewerId,
              action:
                'WORK_ENTRY_REJECTED',
              entityType:
                'WorkEntry',
              entityId:
                entry.id,
              beforeData: {
                status:
                  entry.status,
              },
              afterData: {
                status:
                  ApprovalStatus.REJECTED,
                quantity:
                  entry.quantity,
                reviewerNote:
                  updated.reviewerNote,
              },
            },
          });

          return {
            entryId:
              entry.id,
            workerId:
              entry.workerId,
            workerName:
              entry.worker.fullName,
            batchId:
              entry.batchOperation
                .workBatchId,
            batchCode:
              entry.batchOperation
                .workBatch.code,
            batchOperationId:
              entry.batchOperationId,
            operationId:
              entry.batchOperation
                .operationId,
            operationName:
              entry.batchOperation
                .operation.name,
            quantity:
              entry.quantity,
            unitRate:
              entry.unitRate.toString(),
            totalAmount:
              entry.totalAmount.toString(),
            workerNote:
              entry.workerNote,
            reviewerNote:
              updated.reviewerNote,
            reviewedAt:
              updated.reviewedAt
                ?.toISOString() ??
              null,
          };
        },
      );

    const base = {
      id:
        result.entryId,
      worker: {
        id:
          result.workerId,
        fullName:
          result.workerName,
      },
      batchId:
        result.batchId,
      batchCode:
        result.batchCode,
      batchOperationId:
        result.batchOperationId,
      operationId:
        result.operationId,
      operationName:
        result.operationName,
      quantity:
        result.quantity,
      status:
        ApprovalStatus.REJECTED,
      workerNote:
        result.workerNote,
      reviewerNote:
        result.reviewerNote,
      reviewedAt:
        result.reviewedAt,
    };

    if (
      reviewerRole ===
      UserRole.MANAGER
    ) {
      return {
        ...base,
        unitRate:
          result.unitRate,
        totalAmount:
          result.totalAmount,
      };
    }

    return base;
  }
}
