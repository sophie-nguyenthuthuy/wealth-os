import { ApiProperty } from '@nestjs/swagger';
import { InvestmentOrderType } from '@wealth-os/database';
import { IsEnum, IsNumberString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  fundId!: string;

  @ApiProperty({ enum: InvestmentOrderType })
  @IsEnum(InvestmentOrderType)
  type!: InvestmentOrderType;

  @ApiProperty({
    description:
      'For BUY orders this is the VND amount to invest. For SELL orders this is the number of units.',
    example: '500000',
  })
  @IsNumberString()
  amountOrUnits!: string;
}
