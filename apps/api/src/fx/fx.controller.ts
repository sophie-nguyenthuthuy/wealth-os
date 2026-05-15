import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Currency } from '@wealth-os/database';
import { Public } from '../common/decorators/public.decorator';
import { FxService } from './fx.service';

@ApiTags('fx')
@Controller({ path: 'fx', version: '1' })
export class FxController {
  constructor(private readonly fx: FxService) {}

  @Public()
  @Get('rate')
  @ApiOperation({ summary: 'Latest indicative FX rate for a corridor' })
  async getRate(@Query('base') base: Currency, @Query('quote') quote: Currency) {
    const rate = await this.fx.getLatestRate(base, quote);
    return {
      base: rate.base,
      quote: rate.quote,
      midRate: rate.midRate.toString(),
      bidRate: rate.bidRate.toString(),
      askRate: rate.askRate.toString(),
      capturedAt: rate.capturedAt.toISOString(),
      snapshotId: rate.snapshotId,
    };
  }
}
