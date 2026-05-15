import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ConfirmQuoteDto, CreateQuoteDto } from './dto/quote.dto';
import { RemittanceService } from './remittance.service';

@ApiTags('remittance')
@ApiBearerAuth()
@Controller({ path: 'remittance', version: '1' })
export class RemittanceController {
  constructor(private readonly remittance: RemittanceService) {}

  @Post('quote')
  @ApiOperation({ summary: 'Create a time-bound FX quote for a remittance' })
  async quote(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuoteDto) {
    return this.remittance.createQuote(user.id, dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a quoted remittance, debit wallet, queue settlement' })
  async confirm(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmQuoteDto) {
    return this.remittance.confirmQuote(user.id, dto.remittanceId);
  }

  @Get()
  @ApiOperation({ summary: 'List my remittances' })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.remittance.list(user.id, { limit: Math.min(limit, 100), offset });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single remittance' })
  async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.remittance.getById(user.id, id);
  }
}
