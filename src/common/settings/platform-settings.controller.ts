import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { assertPlatformAdmin } from '../scoping/tenant-scope.util';
import type { JwtRequestUser } from '../../modules/auth/domain/auth.types';
import { PlatformSettingsService } from './platform-settings.service';

@ApiTags('platform-settings')
@Controller()
export class PlatformSettingsController {
  constructor(private readonly settings: PlatformSettingsService) {}

  @Get('platform/settings')
  @ApiBearerAuth()
  list(@CurrentUser() actor: JwtRequestUser) {
    assertPlatformAdmin(actor);
    return this.settings.list();
  }

  @Patch('platform/settings')
  @ApiBearerAuth()
  update(
    @Body() input: Record<string, unknown>,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    assertPlatformAdmin(actor);
    return this.settings.update(input, actor.sub);
  }

  @Public()
  @Get('public/settings')
  publicInfo() {
    return this.settings.publicInfo();
  }
}
