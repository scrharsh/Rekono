import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { SubscriptionPlan } from '../../schemas/user.schema';

export class ActivateSubscriptionDto {
  @ApiPropertyOptional({
    enum: [SubscriptionPlan.BUSINESS_MONTHLY, SubscriptionPlan.BUSINESS_YEARLY],
    default: SubscriptionPlan.BUSINESS_MONTHLY,
  })
  @IsOptional()
  @IsEnum([SubscriptionPlan.BUSINESS_MONTHLY, SubscriptionPlan.BUSINESS_YEARLY])
  plan?: SubscriptionPlan;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;
}
