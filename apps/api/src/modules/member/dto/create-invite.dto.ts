import { IsEmail, IsIn, IsString } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsIn(['member', 'reader'])
  role!: string;
}
