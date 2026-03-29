import { IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class RecoverClusterDto {
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(/^(\S+\s+){11}\S+$/, {
    message: 'Seed phrase deve conter exatamente 12 palavras',
  })
  seedPhrase!: string;
}
