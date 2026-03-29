import { IsString, MinLength, MaxLength, ValidateNested, IsEmail, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class AdminDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Senha deve conter pelo menos 1 maiuscula e 1 numero',
  })
  password!: string;
}

export class CreateClusterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name!: string;

  @ValidateNested()
  @Type(() => AdminDto)
  admin!: AdminDto;
}
