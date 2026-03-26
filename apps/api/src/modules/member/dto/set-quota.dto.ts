import { IsOptional, IsInt, Min } from 'class-validator';

export class SetQuotaDto {
  /** Quota em bytes. Omitir ou null = ilimitado. */
  @IsOptional()
  @IsInt()
  @Min(0)
  bytes?: number;
}
