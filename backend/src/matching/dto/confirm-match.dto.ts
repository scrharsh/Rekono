import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ConfirmMatchDto {
  @IsNotEmpty()
  @IsString()
  saleId: string;

  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
