import { Module } from '@nestjs/common';
import { FxModule } from '../fx/fx.module';
import { RemittanceController } from './remittance.controller';
import { RemittanceService } from './remittance.service';

@Module({
  imports: [FxModule],
  controllers: [RemittanceController],
  providers: [RemittanceService],
  exports: [RemittanceService],
})
export class RemittanceModule {}
