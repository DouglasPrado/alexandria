import { IsString } from 'class-validator';

export class RecoverClusterDto {
  @IsString()
  seedPhrase!: string;
}
