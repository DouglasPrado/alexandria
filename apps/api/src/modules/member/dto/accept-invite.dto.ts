import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class AcceptInviteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Senha deve conter pelo menos 1 maiuscula e 1 numero',
  })
  password!: string;
}
