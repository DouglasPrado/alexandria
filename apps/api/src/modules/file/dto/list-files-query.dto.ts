import { IsOptional, IsIn, IsString, IsUUID, Min, Max, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para query params de GET /api/files.
 * Fonte: docs/backend/10-validation.md (limit min 1 max 100 default 20)
 */
export class ListFilesQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => (value != null ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(['photo', 'video', 'document', 'archive'])
  mediaType?: string;

  @IsOptional()
  @IsIn(['processing', 'ready', 'error', 'corrupted'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
