import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateAutoSavingsRuleDto } from './dto/rule.dto';
import { SavingsService } from './savings.service';

@ApiTags('savings')
@ApiBearerAuth()
@Controller({ path: 'savings', version: '1' })
export class SavingsController {
  constructor(private readonly savings: SavingsService) {}

  @Get('wallets')
  @ApiOperation({ summary: 'List my wallets and balances' })
  async wallets(@CurrentUser() user: AuthenticatedUser) {
    return this.savings.listWallets(user.id);
  }

  @Get('rules')
  @ApiOperation({ summary: 'List my auto-savings rules' })
  async listRules(@CurrentUser() user: AuthenticatedUser) {
    return this.savings.listRules(user.id);
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create an auto-savings rule' })
  async createRule(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAutoSavingsRuleDto) {
    return this.savings.createRule(user.id, dto);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Deactivate (soft-delete) an auto-savings rule' })
  async deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.savings.deactivateRule(user.id, id);
    return { ok: true };
  }
}
