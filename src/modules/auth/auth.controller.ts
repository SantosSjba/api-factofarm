import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OPENAPI_EXAMPLES } from '../../common/openapi/openapi-examples';
import { AuthService } from './application/auth.service';
import { ChangePasswordDto } from './application/dto/change-password.dto';
import { ForgotPasswordDto } from './application/dto/forgot-password.dto';
import { LoginDto } from './application/dto/login.dto';
import { ResetPasswordDto } from './application/dto/reset-password.dto';
import { RefreshTokenDto } from './application/dto/refresh-token.dto';
import { UpdateMeDto } from './application/dto/update-me.dto';
import type { JwtRequestUser } from './domain/auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({
    default: {
      limit: Number(process.env.THROTTLE_LOGIN_LIMIT ?? 10),
      ttl: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión (access + refresh token)' })
  @ApiBody({ type: LoginDto, examples: { demo: { value: OPENAPI_EXAMPLES.loginRequest } } })
  @ApiOkResponse({ schema: { example: OPENAPI_EXAMPLES.loginResponse } })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.ip;
    return this.authService.login(dto.email, dto.password, ip);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña por email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token temporal' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Throttle({
    default: {
      limit: Number(process.env.THROTTLE_LOGIN_LIMIT ?? 10),
      ttl: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
    },
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar tokens con refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión (revocar refresh token)' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  me(@CurrentUser() user: JwtRequestUser) {
    return this.authService.me(user.sub);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar perfil propio' })
  updateMe(@CurrentUser() user: JwtRequestUser, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user.sub, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña' })
  changePassword(
    @CurrentUser() user: JwtRequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
