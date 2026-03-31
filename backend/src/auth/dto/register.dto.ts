import { IsString, IsEnum, MinLength, IsArray, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Used by self-registration — only 'ca' role allowed */
export class SelfRegisterDto {
  @ApiProperty({ example: 'john_ca' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;
}

/** Used by admin to create any role */
export class RegisterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['staff', 'accountant', 'ca', 'admin'] })
  @IsEnum(['staff', 'accountant', 'ca', 'admin'])
  role: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  showroomIds?: string[];
}
