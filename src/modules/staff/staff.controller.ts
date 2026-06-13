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
  constructor(private readonly service: StaffService) {}

  @Get('users/:userId/work-schedule')
  @RequirePermissions('staff.read', 'nav.gestion_personal')
  getSchedule(@Param('userId', ParseUUIDPipe) userId: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getWorkSchedule(userId, actor.establecimientoId);
  }

  @Post('users/:userId/work-schedule')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  upsertSchedule(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpsertWorkScheduleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.upsertWorkSchedule(userId, actor.establecimientoId, dto, actor.sub);
  }

  @Post('users/:userId/attendance/check-in')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  checkIn(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AttendanceCheckInDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.checkIn(userId, actor.establecimientoId, dto.notas);
  }

  @Post('users/:userId/attendance/check-out')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  checkOut(@Param('userId', ParseUUIDPipe) userId: string, @CurrentUser() actor: JwtRequestUser) {
    return this.service.checkOut(userId, actor.establecimientoId);
  }

  @Get('attendance')
  @RequirePermissions('staff.read', 'nav.gestion_personal')
  listAttendance(@Query() query: AttendanceListQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listAttendance(actor.establecimientoId, query);
  }

  @Post('users/:userId/commission-rule')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  upsertCommission(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpsertCommissionRuleDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.upsertCommissionRule(userId, actor.establecimientoId, dto, actor.sub);
  }

  @Get('productivity-report')
  @RequirePermissions('staff.read', 'nav.gestion_personal')
  productivity(@Query() query: StaffProductivityQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.getProductivityReport(actor.establecimientoId, query);
  }

  @Post('users/:userId/leaves')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  createLeave(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateLeaveDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.createLeave(userId, actor.establecimientoId, dto, actor.sub);
  }

  @Get('leaves')
  @RequirePermissions('staff.read', 'nav.gestion_personal')
  listLeaves(@Query('userId') userId: string | undefined, @CurrentUser() actor: JwtRequestUser) {
    return this.service.listLeaves(actor.establecimientoId, userId);
  }

  @Patch('leaves/:leaveId/status')
  @RequirePermissions('staff.write', 'nav.gestion_personal')
  updateLeave(
    @Param('leaveId', ParseUUIDPipe) leaveId: string,
    @Body() dto: UpdateLeaveStatusDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.service.updateLeaveStatus(leaveId, actor.establecimientoId, dto, actor.sub);
  }
}
