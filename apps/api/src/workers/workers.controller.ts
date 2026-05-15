import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UpdateWorkerProfileDto } from './dto/update-profile.dto';
import { WorkersService } from './workers.service';

@ApiTags('workers')
@Controller({ path: 'workers', version: '1' })
export class WorkersController {
  constructor(private readonly workers: WorkersService) {}

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current worker profile' })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.workers.getProfile(user.id);
  }

  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({ summary: 'Update current worker profile' })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWorkerProfileDto,
  ) {
    return this.workers.updateProfile(user.id, dto);
  }

  @Public()
  @Get('unions')
  @ApiOperation({ summary: 'List partner unions, optionally filtered by country' })
  async listUnions(@Query('country') country?: string) {
    return this.workers.listUnions(country);
  }
}
