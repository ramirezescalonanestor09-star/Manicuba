import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  type LoginInput,
  type RefreshInput,
  type RegisterInput,
} from '@manicuba/shared';

const forgotPasswordSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

import { ZodValidationPipe } from '../common/zod.pipe';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register')
  register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    return this.auth.register(body);
  }

  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body);
  }

  @Post('refresh')
  refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(204)
  async forgot(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: { email: string },
  ): Promise<void> {
    await this.auth.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  @HttpCode(204)
  async reset(
    @Body(new ZodValidationPipe(resetPasswordSchema))
    body: { token: string; password: string },
  ): Promise<void> {
    await this.auth.resetPassword(body.token, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const [profile, tenant] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, email: true, name: true, role: true },
      }),
      this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          id: true,
          slug: true,
          businessName: true,
          ownerName: true,
          defaultCurrency: true,
          timezone: true,
          phoneE164: true,
          email: true,
          bio: true,
          loyaltyEvery: true,
          loyaltyDiscount: true,
        },
      }),
    ]);
    return { user: profile, tenant };
  }
}
