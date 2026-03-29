import { IsEmail, IsIn, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateInviteDto {
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  email!: string;

  @IsString()
  @IsIn(['admin', 'member', 'reader'])
  role!: string;
}
