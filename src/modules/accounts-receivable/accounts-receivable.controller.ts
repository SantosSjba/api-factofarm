import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { AccountsReceivableService } from './accounts-receivable.service';
import {
  AccountReceivableListQueryDto,
  RegisterAccountReceivablePaymentDto,
} from './dto/accounts-receivable.dto';

@ApiTags('accounts-receivable')
@ApiBearerAuth()
@Controller('accounts-receivable')
export class AccountsReceivableController {
  constructor(
    private readonly service: AccountsReceivableService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get()
  @RequirePermissions('finance.read', 'nav.cuentas_cobrar')
  async list(@Query() query: AccountReceivableListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.list(await this.scope.resolve(actor), query);
  }

  @Post(':id/payments')
  @RequirePermissions('finance.write', 'nav.cuentas_cobrar')
  async registerPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterAccountReceivablePaymentDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.registerPayment(id, await this.scope.resolve(actor), dto, actor.sub);
  }
}
