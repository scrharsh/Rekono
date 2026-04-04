import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class BulkAssignCaTasksDto {
  @ApiProperty({ type: [String], description: 'Task IDs to assign' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  taskIds: string[];

  @ApiProperty({ description: 'Assignee user identifier' })
  @IsString()
  @MinLength(1)
  assignedToUserId: string;

  @ApiProperty({ description: 'Assignee display name' })
  @IsString()
  @MinLength(1)
  assignedToName: string;

  @ApiPropertyOptional({ description: 'Optional due date for all tasks (ISO string)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
