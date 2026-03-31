import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateSaleDto {
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNumber()
  @Min(0)
  taxableAmount: number;

  @IsNumber()
  @Min(0)
  cgst: number;

  @IsNumber()
  @Min(0)
  sgst: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  igst?: number;

  @IsNotEmpty()
  timestamp: Date;

  @IsArray()
  items: Array<{
    name: string;
    hsnCode?: string;
    quantity?: number;
    rate?: number;
    amount: number;
    gstRate: number;
  }>;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerGSTIN?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsBoolean()
  @IsOptional()
  isInterstate?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
