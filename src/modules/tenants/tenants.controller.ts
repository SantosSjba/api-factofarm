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
import {
  ConvertTenantLeadDto,
  CreateTenantDto,
  ProvisionTenantDto,
  TenantListQueryDto,
  UpdateTenantDto,
  UpdateTenantLeadDto,
} from './dto/tenant.dto';
import { ComplaintListQueryDto, UpdateComplaintDto } from './dto/complaint.dto';
import { ComplaintsService } from './complaints.service';
import { TenantsService } from './tenants.service';
import { AuthService } from '../auth/application/auth.service';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenants: TenantsService,
    private readonly complaints: ComplaintsService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  @RequirePermissions('tenants.read', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Listar clientes SaaS (plataforma FactoFarm)' })
  findAll(@Query() query: TenantListQueryDto) {
    return this.tenants.findAll({
      search: query.search,
      status: query.status,
      plan: query.plan,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('leads')
  @RequirePermissions('tenants.read', 'nav.platform_leads')
  @ApiOperation({ summary: 'Listar leads comerciales' })
  listLeads(@Query() query: TenantListQueryDto) {
    return this.tenants.listLeads({
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Patch('leads/:id')
  @RequirePermissions('tenants.write', 'nav.platform_leads')
  @ApiOperation({ summary: 'Actualizar estado de lead' })
  updateLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantLeadDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.tenants.updateLead(id, dto, actor.sub);
  }

  @Post('leads/:id/convert')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Convertir lead en cliente y aprovisionar acceso inicial' })
  convertLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertTenantLeadDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.tenants.convertLead(id, dto, actor.sub);
  }

  @Get('complaints')
  @RequirePermissions('complaints.read', 'nav.platform_reclamaciones')
  @ApiOperation({ summary: 'Listar reclamos del libro virtual' })
  listComplaints(@Query() query: ComplaintListQueryDto) {
    return this.complaints.findAll({
      search: query.search,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('complaints/:id')
  @RequirePermissions('complaints.read', 'nav.platform_reclamaciones')
  @ApiOperation({ summary: 'Detalle de reclamo' })
  getComplaint(@Param('id', ParseUUIDPipe) id: string) {
    return this.complaints.findOne(id);
  }

  @Patch('complaints/:id')
  @RequirePermissions('complaints.write', 'nav.platform_reclamaciones')
  @ApiOperation({ summary: 'Actualizar estado o notas de reclamo' })
  updateComplaint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComplaintDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.complaints.update(id, dto, actor.sub);
  }

  @Get(':id')
  @RequirePermissions('tenants.read', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Detalle de cliente SaaS' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenants.findOne(id);
  }

  @Post()
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Crear cliente SaaS' })
  create(@Body() dto: CreateTenantDto, @CurrentUser() actor: JwtRequestUser) {
    return this.tenants.create(dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Actualizar cliente SaaS' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.tenants.update(id, dto, actor.sub);
  }

  @Post(':id/activate')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Activar cliente' })
  activate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.tenants.activate(id, actor.sub);
  }

  @Post(':id/suspend')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Suspender cliente' })
  suspend(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.tenants.suspend(id, actor.sub);
  }

  @Post(':id/enter-panel')
  @RequirePermissions('tenants.read', 'nav.platform_clientes')
  @ApiOperation({
    summary: 'Generar acceso de soporte al panel del cliente (abrir en nueva pestaña)',
  })
  enterPanel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.auth.createTenantPanelHandoff(actor, id);
  }

  @Post(':id/provision')
  @RequirePermissions('tenants.write', 'nav.platform_clientes')
  @ApiOperation({ summary: 'Aprovisionar establecimiento y usuario administrador' })
  provision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProvisionTenantDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.tenants.provision(id, dto, actor.sub);
  }
}
