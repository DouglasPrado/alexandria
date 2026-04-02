import { IsString, IsOptional, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class RecoverClusterDto {
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(/^(\S+\s+){11}\S+$/, {
    message: 'Seed phrase deve conter exatamente 12 palavras',
  })
  seedPhrase!: string;

  /** Nome do cluster — obrigatorio para cold recovery (DB vazio) */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clusterName?: string;

  /** Nome do admin — obrigatorio para cold recovery */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  adminName?: string;

  /** Email do admin — obrigatorio para cold recovery */
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  adminEmail?: string;

  /** Senha do admin — obrigatorio para cold recovery */
  @IsOptional()
  @IsString()
  @MinLength(8)
  adminPassword?: string;
}
