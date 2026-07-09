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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import {
  AttendanceCheckInDto,
  AttendanceListQueryDto,
  CreateLeaveDto,
  StaffProductivityQueryDto,
  UpdateLeaveStatusDto,
  UpsertCommissionRuleDto,
  UpsertWorkScheduleDto,
} from './dto/staff.dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(
    private readonly service: StaffService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  @Get('users/:userId/work-schedule')
  @RequirePermissions('staff.read', 'nav.gestion_personal')
  async getSchedule(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.getWorkSchedule(userId, await this.scope.resolve(actor));
  }

  @Post('users/:userId/work-schedule')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  async upsertSchedule(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpsertWorkScheduleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.upsertWorkSchedule(userId, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Post('users/:userId/attendance/check-in')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  async checkIn(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AttendanceCheckInDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.checkIn(userId, await this.scope.resolve(actor), dto.notas);
  }

  @Post('users/:userId/attendance/check-out')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  async checkOut(@Param('userId', ParseUUIDPipe) userId: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.checkOut(userId, await this.scope.resolve(actor));
  }

  @Get('attendance')
  @RequirePermissions('staff.read', 'nav.gestion_personal')
  async listAttendance(@Query() query: AttendanceListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listAttendance(await this.scope.resolve(actor), query);
  }

  @Post('users/:userId/commission-rule')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  async upsertCommission(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpsertCommissionRuleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.upsertCommissionRule(userId, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Get('productivity-report')
  @RequirePermissions('staff.read', 'nav.gestion_personal')
  async productivity(@Query() query: StaffProductivityQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getProductivityReport(await this.scope.resolve(actor), query);
  }

  @Post('users/:userId/leaves')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  async createLeave(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateLeaveDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createLeave(userId, await this.scope.resolve(actor), dto, actor.sub);
  }

  @Get('leaves')
  @RequirePermissions('staff.read', 'nav.gestion_personal')
  async listLeaves(
    @Query('userId') userId: string | undefined,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.listLeaves(await this.scope.resolve(actor), userId);
  }

  @Patch('leaves/:leaveId/status')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  async updateLeave(
    @Param('leaveId', ParseUUIDPipe) leaveId: string,
    @Body() dto: UpdateLeaveStatusDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateLeaveStatus(leaveId, await this.scope.resolve(actor), dto, actor.sub);
  }
}
