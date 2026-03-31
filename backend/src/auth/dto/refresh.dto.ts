import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ description: 'Current valid JWT access token' })
  @IsString()
  @IsNotEmpty()
  access_token: string;
}
