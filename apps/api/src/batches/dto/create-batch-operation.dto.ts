import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBatchOperationDto {
  @IsString()
  operationId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetQuantity?: number;
}