import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { ArcoRequestStatus, ArcoRequestType, TaxWithholdingKind } from '../../generated/prisma/client';
import { LegalService } from './services/legal.service';
import { LpdpService } from './services/lpdp.service';
import { PharmacistLicenseService } from './services/pharmacist-license.service';
import { RegulatedPriceService } from './services/regulated-price.service';
import { PleService } from './services/ple.service';
import { TaxWithholdingService } from './services/tax-withholding.service';
import { SunatBooksService } from './services/sunat-books.service';
import {
  CreateArcoRequestDto,
  CreatePharmacistLicenseDto,
  ImportRegulatedPricesDto,
  ProcessArcoRequestDto,
  UpsertRegulatedPriceDto,
  UpdatePharmacistLicenseDto,
  CreateTaxWithholdingDto,
} from './dto/compliance.dto';

@ApiTags('legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  @Public()
  @Get('privacy')
  @ApiOperation({ summary: 'Política de privacidad LPDP' })
  privacy() {
    return this.legal.getPrivacyPolicy();
  }

  @Public()
  @Get('terms')
  @ApiOperation({ summary: 'Términos de uso de la plataforma' })
  terms() {
    return this.legal.getTermsOfUse();
  }

  @Public()
  @Get('libro-reclamaciones')
  @ApiOperation({ summary: 'Libro de reclamaciones virtual (Ley 29571)' })
  complaintsBook() {
    return this.legal.getComplaintsBook();
  }
}

@ApiTags('compliance')
@ApiBearerAuth()
@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly lpdp: LpdpService,
    private readonly pharmacist: PharmacistLicenseService,
    private readonly regulated: RegulatedPriceService,
    private readonly ple: PleService,
    private readonly taxWithholding: TaxWithholdingService,
    private readonly sunatBooks: SunatBooksService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get('lpdp/treatment-matrix')
  @RequirePermissions('compliance.read', 'nav.lpdp')
  @ApiOperation({ summary: 'Matriz de tratamiento de datos LPDP' })
  treatmentMatrix() {
    return this.lpdp.getTreatmentMatrix();
  }

  @Get('lpdp/retention-candidates')
  @RequirePermissions('compliance.read', 'nav.lpdp')
  @ApiOperation({ summary: 'Clientes candidatos a retención/eliminación programada' })
  retentionCandidates() {
    return this.lpdp.listRetentionCandidates();
  }

  @Get('lpdp/arco')
  @RequirePermissions('compliance.read', 'nav.lpdp')
  @ApiOperation({ summary: 'Listar solicitudes ARCO' })
  listArco(@Query('status') status?: ArcoRequestStatus) {
    return this.lpdp.listArcoRequests(status);
  }

  @Post('lpdp/arco')
  @RequirePermissions('compliance.write', 'customers.write', 'nav.lpdp')
  @ApiOperation({ summary: 'Registrar solicitud ARCO' })
  createArco(@Body() dto: CreateArcoRequestDto, @CurrentUser() actor: JwtRequestUser) {
    return this.lpdp.createArcoRequest(
      dto.customerId,
      dto.requestType,
      dto.details,
      actor.sub,
    );
  }

  @Patch('lpdp/arco/:id')
  @RequirePermissions('compliance.write', 'nav.lpdp')
  @ApiOperation({ summary: 'Procesar solicitud ARCO' })
  processArco(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessArcoRequestDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.lpdp.processArcoRequest(id, dto.status, dto.responseNotes, actor.sub);
  }

  @Get('lpdp/customers/:customerId/export')
  @RequirePermissions('compliance.read', 'customers.read', 'nav.lpdp')
  @ApiOperation({ summary: 'Exportar datos del cliente (derecho de acceso ARCO)' })
  exportCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.lpdp.exportCustomerData(customerId);
  }

  @Get('pharmacist-licenses')
  @RequirePermissions('compliance.read', 'establishments.read', 'nav.farmaceutico_titular')
  @ApiOperation({ summary: 'Listar licencias de farmacéuticos' })
  listPharmacists(@Query('includeInactive') includeInactive?: string) {
    return this.pharmacist.list(includeInactive === 'true');
  }

  @Post('pharmacist-licenses')
  @RequirePermissions('compliance.write', 'establishments.write', 'nav.farmaceutico_titular')
  @ApiOperation({ summary: 'Registrar licencia farmacéutica' })
  createPharmacist(@Body() dto: CreatePharmacistLicenseDto, @CurrentUser() actor: JwtRequestUser) {
    return this.pharmacist.create(dto, actor.sub);
  }

  @Patch('pharmacist-licenses/:id')
  @RequirePermissions('compliance.write', 'establishments.write', 'nav.farmaceutico_titular')
  @ApiOperation({ summary: 'Actualizar licencia farmacéutica' })
  updatePharmacist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePharmacistLicenseDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.pharmacist.update(id, dto, actor.sub);
  }

  @Post('pharmacist-licenses/:id/remove')
  @RequirePermissions('compliance.write', 'establishments.write', 'nav.farmaceutico_titular')
  @ApiOperation({ summary: 'Eliminar licencia farmacéutica' })
  removePharmacist(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.pharmacist.remove(id, actor.sub);
  }

  @Get('pharmacist-licenses/dispensation-signature')
  @RequirePermissions('pharmaceutical.write', 'sales.write', 'nav.punto_venta')
  @ApiOperation({ summary: 'Generar firma digital para dispensación controlados' })
  async dispensationSignature(
    @Query('licenseId') licenseId: string,
    @Query('approverUserId') approverUserId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return {
      signature: this.pharmacist.buildDispensationSignature(
        licenseId,
        approverUserId,
        await this.scope.resolve(actor),
      ),
    };
  }

  @Get('regulated-prices')
  @RequirePermissions('compliance.read', 'products.read', 'nav.precios_regulados')
  @ApiOperation({ summary: 'Catálogo precios regulados DIGEMED' })
  listRegulated(@Query('search') search?: string) {
    return this.regulated.list(search);
  }

  @Post('regulated-prices')
  @RequirePermissions('compliance.write', 'products.write', 'nav.precios_regulados')
  @ApiOperation({ summary: 'Registrar precio regulado' })
  upsertRegulated(@Body() dto: UpsertRegulatedPriceDto, @CurrentUser() actor: JwtRequestUser) {
    return this.regulated.upsert(dto, actor.sub);
  }

  @Post('regulated-prices/import')
  @RequirePermissions('compliance.write', 'products.write', 'nav.precios_regulados')
  @ApiOperation({ summary: 'Importar lote de precios regulados' })
  importRegulated(@Body() dto: ImportRegulatedPricesDto, @CurrentUser() actor: JwtRequestUser) {
    return this.regulated.importBatch(dto.rows, actor.sub);
  }

  @Post('regulated-prices/:id/remove')
  @RequirePermissions('compliance.write', 'products.write', 'nav.precios_regulados')
  @ApiOperation({ summary: 'Eliminar precio regulado' })
  removeRegulated(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.regulated.remove(id, actor.sub);
  }

  @Get('ple/:book')
  @RequirePermissions(
    'compliance.read',
    'billing.read',
    'nav.contabilidad_exportar_formatos',
    'nav.sire_ventas',
    'nav.sire_compras',
  )
  @ApiOperation({ summary: 'Exportar libro PLE TXT (14.1 ventas, 8.1 compras, 13.1 inventario)' })
  async pleExport(
    @Param('book') book: '14.1' | '8.1' | '13.1',
    @Query('period') period: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.ple.buildTxt(await this.scope.resolve(actor), period, book);
  }

  @Get('accountant-summary')
  @RequirePermissions(
    'compliance.read',
    'billing.read',
    'nav.contabilidad_exportar_reporte',
    'nav.sire_ventas',
    'nav.sire_compras',
  )
  @ApiOperation({ summary: 'Resumen para contador externo' })
  async accountantSummary(@Query('period') period: string, @CurrentUser() actor: JwtRequestUser) {
    return this.ple.accountantSummary(await this.scope.resolve(actor), period);
  }

  @Get('sunat-rates')
  @RequirePermissions('compliance.read', 'billing.read', 'nav.retenciones', 'nav.percepciones')
  @ApiOperation({ summary: 'Catálogo tasas retención/percepción/detracción' })
  sunatRates(@Query('kind') kind?: TaxWithholdingKind) {
    return this.taxWithholding.listRates(kind);
  }

  @Get('tax-withholding/:kind')
  @RequirePermissions('compliance.read', 'billing.read', 'nav.retenciones', 'nav.percepciones')
  @ApiOperation({ summary: 'Listar registros de retención, percepción o detracción' })
  async listTaxWithholding(
    @Param('kind') kind: TaxWithholdingKind,
    @CurrentUser() actor: JwtRequestUser,
    @Query('period') period?: string,
  ) {
    return this.taxWithholding.listRecords(await this.scope.resolve(actor), kind, period);
  }

  @Post('tax-withholding/calculate')
  @RequirePermissions('compliance.write', 'billing.write', 'nav.retenciones', 'nav.percepciones')
  @ApiOperation({ summary: 'Calcular monto de retención/percepción' })
  calculateTax(@Body() dto: { baseImponible: number; tasa: number }) {
    return this.taxWithholding.calculate(dto.baseImponible, dto.tasa);
  }

  @Post('tax-withholding/retenciones')
  @RequirePermissions('compliance.write', 'billing.write', 'nav.retenciones')
  @ApiOperation({ summary: 'Registrar y emitir comprobante de retención' })
  async createRetention(@Body() dto: CreateTaxWithholdingDto, @CurrentUser() actor: JwtRequestUser) {
    return this.taxWithholding.createRetention(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Post('tax-withholding/percepciones')
  @RequirePermissions('compliance.write', 'billing.write', 'nav.percepciones')
  @ApiOperation({ summary: 'Registrar y emitir comprobante de percepción' })
  async createPerception(@Body() dto: CreateTaxWithholdingDto, @CurrentUser() actor: JwtRequestUser) {
    return this.taxWithholding.createPerception(await this.scope.resolve(actor), dto, actor.sub);
  }

  @Post('tax-withholding/detracciones/sync')
  @RequirePermissions('compliance.write', 'billing.write', 'nav.retenciones')
  @ApiOperation({ summary: 'Sincronizar detracciones desde facturas electrónicas' })
  async syncDetracciones(@CurrentUser() actor: JwtRequestUser, @Query('period') period?: string) {
    return this.taxWithholding.syncDetracciones(await this.scope.resolve(actor), period, actor.sub);
  }

  @Get('sunat-books/sales-register')
  @RequirePermissions('compliance.read', 'billing.read', 'nav.contabilidad_exportar_formatos')
  @ApiOperation({ summary: 'Libro de ventas formato SUNAT (Excel RVIE)' })
  async salesRegister(
    @Query('period') period: string,
    @CurrentUser() actor: JwtRequestUser,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.sunatBooks.buildSalesRegisterBuffer(
      await this.scope.resolve(actor),
      period,
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  @Get('sunat-books/inventory-register')
  @RequirePermissions('compliance.read', 'billing.read', 'nav.contabilidad_exportar_formatos')
  @ApiOperation({ summary: 'Registro de inventarios formato SUNAT (Excel)' })
  async inventoryRegister(
    @Query('period') period: string,
    @CurrentUser() actor: JwtRequestUser,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.sunatBooks.buildInventoryRegisterBuffer(
      await this.scope.resolve(actor),
      period,
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }
}
