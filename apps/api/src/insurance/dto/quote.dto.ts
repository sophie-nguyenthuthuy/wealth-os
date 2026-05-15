import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class QuotePolicyDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @IsUUID()
  beneficiaryId!: string;
}

export class ActivatePolicyDto {
  @ApiProperty()
  @IsUUID()
  policyId!: string;
}
