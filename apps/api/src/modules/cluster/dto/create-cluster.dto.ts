import { IsString, MinLength, MaxLength, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

class AdminDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class CreateClusterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ValidateNested()
  @Type(() => AdminDto)
  admin!: AdminDto;
}
