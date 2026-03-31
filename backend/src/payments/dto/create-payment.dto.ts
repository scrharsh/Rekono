import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';

export enum PaymentMethod {
  PHONEPE = 'phonepe',
  GOOGLEPAY = 'googlepay',
  PAYTM = 'paytm',
  BHIM = 'bhim',
  BANK = 'bank',
  CASH = 'cash',
}

export class CreatePaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty()
  timestamp: Date;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  senderName?: string;

  @IsString()
  @IsOptional()
  rawSMS?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
