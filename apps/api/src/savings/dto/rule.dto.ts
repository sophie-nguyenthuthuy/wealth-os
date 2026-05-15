import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoSavingsTrigger, Currency } from '@wealth-os/database';
import { IsEnum, IsInt, IsNumberString, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateAutoSavingsRuleDto {
  @ApiProperty()
  @IsUUID()
  sourceWalletId!: string;

  @ApiProperty()
  @IsUUID()
  targetWalletId!: string;

  @ApiProperty({ enum: AutoSavingsTrigger })
  @IsEnum(AutoSavingsTrigger)
  trigger!: AutoSavingsTrigger;

  @ApiPropertyOptional({ description: 'Basis points (100 = 1%). 0–10000.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  percentBps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  fixedAmount?: string;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  fixedCurrency?: Currency;
}
