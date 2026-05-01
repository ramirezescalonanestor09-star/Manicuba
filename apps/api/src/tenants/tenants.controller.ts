import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod.pipe';
import { PrismaService } from '../common/prisma.service';

const tenantUpdateSchema = z.object({
  businessName: z.string().min(2).max(80).optional(),
  ownerName: z.string().min(2).max(80).optional(),
  bio: z.string().max(1000).optional(),
  defaultCurrency: z.enum(['CUP', 'MLC', 'USD']).optional(),
  timezone: z.string().optional(),
  loyaltyEvery: z.number().int().positive().optional(),
  loyaltyDiscount: z.number().int().min(0).max(100).optional(),
  ratesCupPerUsd: z.number().positive().optional(),
  ratesMlcPerUsd: z.number().positive().optional(),
});

type TenantUpdate = z.infer<typeof tenantUpdateSchema>;

@UseGuards(JwtAuthGuard)
@Controller('tenant')
export class TenantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.prisma.tenant.findUnique({ where: { id: user.tenantId } });
  }

  @Patch()
  update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(tenantUpdateSchema)) body: TenantUpdate,
  ) {
    return this.prisma.tenant.update({ where: { id: user.tenantId }, data: body });
  }
}
