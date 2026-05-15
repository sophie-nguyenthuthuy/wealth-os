import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CreateOrderDto } from './dto/order.dto';
import { InvestmentsService } from './investments.service';

@ApiTags('investments')
@Controller({ path: 'investments', version: '1' })
export class InvestmentsController {
  constructor(private readonly investments: InvestmentsService) {}

  @Public()
  @Get('funds')
  @ApiOperation({ summary: 'List active fund products' })
  async listFunds() {
    return this.investments.listFunds();
  }

  @Public()
  @Get('funds/:id')
  @ApiOperation({ summary: 'Fund detail + 30 days of NAV' })
  async getFund(@Param('id', ParseUUIDPipe) id: string) {
    return this.investments.getFund(id);
  }

  @ApiBearerAuth()
  @Get('holdings')
  @ApiOperation({ summary: 'List my fund holdings' })
  async holdings(@CurrentUser() user: AuthenticatedUser) {
    return this.investments.listHoldings(user.id);
  }

  @ApiBearerAuth()
  @Post('orders')
  @ApiOperation({ summary: 'Create a fund BUY or SELL order' })
  async createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.investments.createOrder(user.id, dto);
  }

  @ApiBearerAuth()
  @Get('orders')
  @ApiOperation({ summary: 'List my fund orders (most recent 100)' })
  async orders(@CurrentUser() user: AuthenticatedUser) {
    return this.investments.listOrders(user.id);
  }
}
