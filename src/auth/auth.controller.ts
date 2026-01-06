import { Body, Controller, Get, Logger, Post, Query, Redirect } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { RequestUnlockDto } from './dto/request-unlock.dto.js';
import { ResetPasswordAfterRevertDto } from './dto/reset-password-after-revert.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

import { ApiResponse } from '../common/index.js';
import { User } from '../users/entities/user.entity.js';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger('AuthController');

  public constructor(private readonly authService: AuthService) {}

  // ===== POST METHODS =====

  @Post()
  public async create(
    @Body() dto: CreateUserDto,
  ): Promise<ApiResponse<null>> {
    this.logger.debug(`📩 POST /auth - Registration request for ${dto.email}`);
    try {
      await this.authService.create(dto);
      return {
        success: true,
        message: 'Confirmation email sent to ' + dto.email,
        data: null,
      };
    } catch (error) {
      this.logger.error(`❌ Registration endpoint error:`, error);
      throw error;
    }
  }

  @Post('login')
  public async login(@Body() dto: LoginDto): Promise<ApiResponse<{ access_token: string; user: Omit<User, 'password'> }>> {
    const { accessToken, user } = await this.authService.login(dto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return {
      success: true,
      message: 'Login successful',
      data: { access_token: accessToken, user: safeUser },
    };
  }

  @Post('request-password-reset')
  public async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<ApiResponse<null>> {
    await this.authService.requestPasswordReset(dto);
    return {
      success: true,
      message: 'If your email is registered and is confirmed, a link was sent',
      data: null,
    };
  }

  @Post('reset-password')
  public async resetPassword(
    @Query('token') token: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<ApiResponse<null>> {
    await this.authService.resetPassword(token, dto);
    return {
      success: true,
      message: 'Password changed successfully',
      data: null,
    };
  }

  @Post('reset-password-after-revert')
  public async resetPasswordAfterRevert(
    @Query('token') token: string,
    @Body() dto: ResetPasswordAfterRevertDto,
  ): Promise<ApiResponse<null>> {
    await this.authService.resetPasswordAfterRevert(token, dto);
    return {
      success: true,
      message: 'Password changed successfully',
      data: null,
    };
  }

  @Post('request-unlock')
  public async requestUnlock(
    @Body() dto: RequestUnlockDto,
  ): Promise<ApiResponse<null>> {
    await this.authService.requestUnlock(dto);
    return {
      success: true,
      message: 'If your email is registered and is locked, a link was sent',
      data: null,
    };
  }

  // ===== GET METHODS =====

  @Get('confirm-email')
  @Redirect()
  public async confirmEmail(
    @Query('token') token: string,
  ): Promise<{ url: string }> {
    await this.authService.confirmEmail(token);
    const frontendUrl = process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:3001';
    return { url: `${frontendUrl}?emailConfirmed=true` };
  }

  @Get('confirm-email-update')
  public async confirmEmailUpdate(
    @Query('token') token: string,
  ): Promise<ApiResponse<null>> {
    await this.authService.confirmEmailUpdate(token);
    return {
      success: true,
      message: 'Email changed successfully',
      data: null,
    };
  }

  @Get('revert-email')
  public async revertEmail(
    @Query('token') token: string,
  ): Promise<ApiResponse<{ reset_token: string }>> {
    const reset_token = await this.authService.revertEmail(token);
    return {
      success: true,
      message: 'Email reverted successfully',
      data: { reset_token },
    };
  }

  @Get('unlock-account')
  public async unlockAccount(
    @Query('token') token: string,
  ): Promise<ApiResponse<null>> {
    await this.authService.unlockAccount(token);
    return {
      success: true,
      message: 'Your account has been unlocked. You can now log in',
      data: null,
    };
  }
}
