import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ActivatePolicyDto, QuotePolicyDto } from './dto/quote.dto';
import { InsuranceService } from './insurance.service';

@ApiTags('insurance')
@Controller({ path: 'insurance', version: '1' })
export class InsuranceController {
  constructor(private readonly insurance: InsuranceService) {}

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'List active insurance products' })
  async products() {
    return this.insurance.listProducts();
  }

  @ApiBearerAuth()
  @Post('quote')
  @ApiOperation({ summary: 'Create a policy quote (status=QUOTED)' })
  async quote(@CurrentUser() user: AuthenticatedUser, @Body() dto: QuotePolicyDto) {
    return this.insurance.quote(user.id, dto);
  }

  @ApiBearerAuth()
  @Post('activate')
  @ApiOperation({ summary: 'Activate a quoted policy and schedule first premium' })
  async activate(@CurrentUser() user: AuthenticatedUser, @Body() dto: ActivatePolicyDto) {
    return this.insurance.activate(user.id, dto.policyId);
  }

  @ApiBearerAuth()
  @Get('policies')
  @ApiOperation({ summary: 'List my policies' })
  async policies(@CurrentUser() user: AuthenticatedUser) {
    return this.insurance.listPolicies(user.id);
  }
}
