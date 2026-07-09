import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { BillingService } from './billing.service';
import {
  BillingDocumentListQueryDto,
  DailySummaryDto,
  EmitFromSaleDto,
  EmitSpecialDocumentDto,
  UpsertBillingConfigDto,
  VoidBillingDocumentDto,
} from './dto/billing.dto';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(
    private readonly service: BillingService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get('config')
  @RequirePermissions('billing.read', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Configuración OSE/certificado del establecimiento' })
  async getConfig(@CurrentUser() actor: JwtRequestUser) {
    return this.service.getConfig(await this.scope.resolve(actor));
  }

  @Patch('config')
  @RequirePermissions('billing.write', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Actualizar configuración OSE y certificado' })
  async upsertConfig(@Body() dto: UpsertBillingConfigDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.upsertConfig(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Get('documents')
  @RequirePermissions('billing.read', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Bandeja de comprobantes electrónicos' })
  async listDocuments(@Query() query: BillingDocumentListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listDocuments(await this.scope.resolve(actor), query);
  }

  @Get('documents/:id')
  @RequirePermissions('billing.read', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Detalle de comprobante electrónico' })
  async getDocument(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getDocument(id, await this.scope.resolve(actor));
  }

  @Post('sales/:saleId/emit')
  @RequirePermissions('billing.write', 'nav.comprobante_electronico', 'nav.punto_venta')
  @ApiOperation({ summary: 'Emitir CPE desde venta (manual)' })
  async emitFromSale(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() _dto: EmitFromSaleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.emitFromSale(saleId, await this.scope.resolve(actor));
  }

  @Get('sales/:saleId/status')
  @RequirePermissions('billing.read', 'nav.punto_venta', 'nav.notas_venta')
  @ApiOperation({ summary: 'Estado SUNAT de la venta' })
  async saleStatus(@Param('saleId', ParseUUIDPipe) saleId: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getSaleBillingStatus(saleId, await this.scope.resolve(actor));
  }

  @Post('documents/:id/retry')
  @RequirePermissions('billing.write', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Reenviar comprobante rechazado' })
  async retry(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.retryDocument(id, await this.scope.resolve(actor), actor.sub);
  }

  @Post('documents/:id/void')
  @RequirePermissions('billing.void', 'nav.anulaciones')
  @ApiOperation({ summary: 'Comunicación de baja / anulación SUNAT' })
  async voidDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidBillingDocumentDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.voidDocument(id, await this.scope.resolve(actor), dto.reason, actor.sub);
  }

  @Post('daily-summary')
  @RequirePermissions('billing.write', 'nav.resumenes')
  @ApiOperation({ summary: 'Resumen diario de boletas (RC)' })
  async dailySummary(@Body() dto: DailySummaryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.sendDailySummary(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Get('validate-ruc/:ruc')
  @RequirePermissions('billing.read', 'customers.read', 'customers.write')
  @ApiOperation({ summary: 'Validar RUC contribuyente vía Factiliza' })
  async validateRuc(@Param('ruc') ruc: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.validateRuc(await this.scope.resolve(actor), ruc);
  }

  @Get('validate-dni/:dni')
  @RequirePermissions('billing.read', 'customers.read', 'customers.write')
  @ApiOperation({ summary: 'Consultar DNI vía RENIEC (Factiliza)' })
  async validateDni(@Param('dni') dni: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.validateDni(await this.scope.resolve(actor), dni);
  }

  @Post('documents/:id/refresh-status')
  @RequirePermissions('billing.read', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Consultar estado CPE en SUNAT/OSE' })
  async refreshStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.refreshDocumentStatus(id, await this.scope.resolve(actor), actor.sub);
  }

  @Post('transfers/:transferId/emit-guia')
  @RequirePermissions('billing.write', 'nav.traslados')
  @ApiOperation({ summary: 'Emitir guía de remisión electrónica desde traslado' })
  async emitGuiaFromTransfer(
    @Param('transferId', ParseUUIDPipe) transferId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.emitGuiaFromTransfer(transferId, await this.scope.resolve(actor));
  }

  @Post('documents/special')
  @RequirePermissions('billing.write', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Emitir retención, percepción, liquidación compra o guía transportista' })
  async emitSpecial(@Body() dto: EmitSpecialDocumentDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.emitSpecialDocument(await this.scope.resolve(actor), dto, actor.sub);
  }
}
