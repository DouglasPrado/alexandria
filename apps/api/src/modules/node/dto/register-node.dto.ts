import { IsString, IsIn, IsOptional, MinLength, MaxLength } from 'class-validator';

export class RegisterNodeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsIn(['local', 's3', 'r2', 'b2', 'vps'])
  type!: string;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  bucket?: string;

  @IsOptional()
  @IsString()
  accessKey?: string;

  @IsOptional()
  @IsString()
  secretKey?: string;

  @IsOptional()
  @IsString()
  region?: string;
}
