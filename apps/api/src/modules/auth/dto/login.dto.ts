import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'member@alexandria.app', description: 'Email do membro' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'securepass', minLength: 8, description: 'Senha do membro' })
  @IsString()
  @MinLength(8)
  password!: string;
}
