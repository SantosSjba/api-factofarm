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
  constructor(private readonly service: BillingService) {}

  @Get('config')
  @RequirePermissions('billing.read', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Configuración OSE/certificado del establecimiento' })
  getConfig(@CurrentUser() actor: JwtRequestUser) {
    return this.service.getConfig(actor.establecimientoId);
  }

  @Patch('config')
  @RequirePermissions('billing.write', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Actualizar configuración OSE y certificado' })
  upsertConfig(@Body() dto: UpsertBillingConfigDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.upsertConfig(actor.establecimientoId, dto, actor.sub);
  }

  @Get('documents')
  @RequirePermissions('billing.read', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Bandeja de comprobantes electrónicos' })
  listDocuments(@Query() query: BillingDocumentListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listDocuments(actor.establecimientoId, query);
  }

  @Get('documents/:id')
  @RequirePermissions('billing.read', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Detalle de comprobante electrónico' })
  getDocument(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getDocument(id, actor.establecimientoId);
  }

  @Post('sales/:saleId/emit')
  @RequirePermissions('billing.write', 'nav.comprobante_electronico', 'nav.punto_venta')
  @ApiOperation({ summary: 'Emitir CPE desde venta (manual)' })
  emitFromSale(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() _dto: EmitFromSaleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.emitFromSale(saleId, actor.establecimientoId);
  }

  @Get('sales/:saleId/status')
  @RequirePermissions('billing.read', 'nav.punto_venta', 'nav.notas_venta')
  @ApiOperation({ summary: 'Estado SUNAT de la venta' })
  saleStatus(@Param('saleId', ParseUUIDPipe) saleId: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getSaleBillingStatus(saleId, actor.establecimientoId);
  }

  @Post('documents/:id/retry')
  @RequirePermissions('billing.write', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Reenviar comprobante rechazado' })
  retry(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.retryDocument(id, actor.establecimientoId, actor.sub);
  }

  @Post('documents/:id/void')
  @RequirePermissions('billing.void', 'nav.anulaciones')
  @ApiOperation({ summary: 'Comunicación de baja / anulación SUNAT' })
  voidDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidBillingDocumentDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.voidDocument(id, actor.establecimientoId, dto.reason, actor.sub);
  }

  @Post('daily-summary')
  @RequirePermissions('billing.write', 'nav.resumenes')
  @ApiOperation({ summary: 'Resumen diario de boletas (RC)' })
  dailySummary(@Body() dto: DailySummaryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.sendDailySummary(actor.establecimientoId, dto, actor.sub);
  }

  @Get('validate-ruc/:ruc')
  @RequirePermissions('billing.read', 'customers.read', 'customers.write')
  @ApiOperation({ summary: 'Validar RUC contribuyente vía Factiliza' })
  validateRuc(@Param('ruc') ruc: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.validateRuc(actor.establecimientoId, ruc);
  }

  @Get('validate-dni/:dni')
  @RequirePermissions('billing.read', 'customers.read', 'customers.write')
  @ApiOperation({ summary: 'Consultar DNI vía RENIEC (Factiliza)' })
  validateDni(@Param('dni') dni: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.validateDni(actor.establecimientoId, dni);
  }

  @Post('documents/:id/refresh-status')
  @RequirePermissions('billing.read', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Consultar estado CPE en SUNAT/OSE' })
  refreshStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.refreshDocumentStatus(id, actor.establecimientoId, actor.sub);
  }

  @Post('transfers/:transferId/emit-guia')
  @RequirePermissions('billing.write', 'nav.traslados')
  @ApiOperation({ summary: 'Emitir guía de remisión electrónica desde traslado' })
  emitGuiaFromTransfer(
    @Param('transferId', ParseUUIDPipe) transferId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.emitGuiaFromTransfer(transferId, actor.establecimientoId);
  }

  @Post('documents/special')
  @RequirePermissions('billing.write', 'nav.comprobante_electronico')
  @ApiOperation({ summary: 'Emitir retención, percepción, liquidación compra o guía transportista' })
  emitSpecial(@Body() dto: EmitSpecialDocumentDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.emitSpecialDocument(actor.establecimientoId, dto, actor.sub);
  }
}
