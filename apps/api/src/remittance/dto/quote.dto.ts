import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@wealth-os/database';
import { IsEnum, IsNumberString, IsUUID } from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  sourceCurrency!: Currency;

  @ApiProperty({ enum: Currency, example: Currency.VND })
  @IsEnum(Currency)
  destCurrency!: Currency;

  @ApiProperty({
    description: 'Decimal string, e.g. "50000" for ¥50,000.',
    example: '50000',
  })
  @IsNumberString({ no_symbols: false })
  sourceAmount!: string;

  @ApiProperty()
  @IsUUID()
  beneficiaryId!: string;
}

export class ConfirmQuoteDto {
  @ApiProperty()
  @IsUUID()
  remittanceId!: string;
}
