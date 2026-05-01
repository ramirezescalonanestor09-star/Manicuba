import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  availabilityExceptionSchema,
  availabilityWindowSchema,
  type AvailabilityExceptionInput,
  type AvailabilityWindowInput,
} from '@manicuba/shared';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { PrismaService } from '../common/prisma.service';
import { ZodValidationPipe } from '../common/zod.pipe';

@UseGuards(JwtAuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('windows')
  windows(@CurrentUser() user: AuthUser) {
    return this.prisma.availabilityWindow.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  @Post('windows')
  createWindow(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(availabilityWindowSchema)) body: AvailabilityWindowInput,
  ) {
    return this.prisma.availabilityWindow.create({
      data: { ...body, tenantId: user.tenantId },
    });
  }

  @Delete('windows/:id')
  async deleteWindow(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.prisma.availabilityWindow.deleteMany({
      where: { id, tenantId: user.tenantId },
    });
    return { ok: true };
  }

  @Get('exceptions')
  exceptions(@CurrentUser() user: AuthUser) {
    return this.prisma.availabilityException.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { date: 'asc' },
    });
  }

  @Post('exceptions')
  createException(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(availabilityExceptionSchema)) body: AvailabilityExceptionInput,
  ) {
    return this.prisma.availabilityException.create({
      data: {
        tenantId: user.tenantId,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        type: body.type,
        reason: body.reason,
      },
    });
  }
}
