import { Body, Controller, Get, Header, Post, Patch, UseGuards } from '@nestjs/common';
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

  @Post('available-now')
  async availableNow(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(
      z.object({
        until: z.string().datetime().nullable(),
        note: z.string().max(160).optional(),
      }),
    ))
    body: { until: string | null; note?: string },
  ) {
    return this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        availableNowUntil: body.until ? new Date(body.until) : null,
        availableNowNote: body.note ?? null,
      },
    });
  }

  @Get('backup')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="manicuba-backup.json"')
  async backup(@CurrentUser() user: AuthUser) {
    const where = { tenantId: user.tenantId };
    const [tenant, clients, services, requests, appointments, expenses, templates, gallery] =
      await Promise.all([
        this.prisma.tenant.findUnique({ where: { id: user.tenantId } }),
        this.prisma.client.findMany({ where }),
        this.prisma.service.findMany({ where }),
        this.prisma.serviceRequest.findMany({
          where,
          include: { quote: true, images: true },
        }),
        this.prisma.appointment.findMany({ where }),
        this.prisma.expense.findMany({ where }),
        this.prisma.quoteTemplate.findMany({ where }),
        this.prisma.galleryItem.findMany({ where }),
      ]);
    return {
      exportedAt: new Date().toISOString(),
      tenant,
      clients,
      services,
      requests,
      appointments,
      expenses,
      quoteTemplates: templates,
      gallery,
    };
  }
}
