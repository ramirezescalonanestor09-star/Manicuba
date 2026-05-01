import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { PrismaService } from '../common/prisma.service';
import { ZodValidationPipe } from '../common/zod.pipe';

const expenseCreateSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['CUP', 'MLC', 'USD']),
  category: z.string().max(60).optional(),
  description: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
});

@UseGuards(JwtAuthGuard)
@Controller('cash')
export class CashController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('expenses')
  expenses(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.prisma.expense.findMany({
      where: {
        tenantId: user.tenantId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  @Post('expenses')
  createExpense(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(expenseCreateSchema)) body: z.infer<typeof expenseCreateSchema>,
  ) {
    return this.prisma.expense.create({
      data: {
        tenantId: user.tenantId,
        amount: body.amount,
        currency: body.currency,
        category: body.category,
        description: body.description,
        date: body.date ? new Date(body.date) : new Date(),
      },
    });
  }

  @Delete('expenses/:id')
  async deleteExpense(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const owned = await this.prisma.expense.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!owned) throw new NotFoundException();
    await this.prisma.expense.delete({ where: { id } });
    return { ok: true };
  }

  @Get('report')
  async report(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const where = {
      tenantId: user.tenantId,
      ...(from || to
        ? {
            paidAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      status: 'COMPLETED' as const,
    };
    const [paidAppts, expenses] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        select: { amountPaid: true, tipAmount: true, currency: true },
      }),
      this.prisma.expense.findMany({
        where: {
          tenantId: user.tenantId,
          ...(from || to
            ? {
                date: {
                  ...(from ? { gte: new Date(from) } : {}),
                  ...(to ? { lte: new Date(to) } : {}),
                },
              }
            : {}),
        },
        select: { amount: true, currency: true },
      }),
    ]);

    const income: Record<string, number> = {};
    const tips: Record<string, number> = {};
    for (const a of paidAppts) {
      if (!a.currency) continue;
      income[a.currency] = (income[a.currency] ?? 0) + (a.amountPaid ?? 0);
      tips[a.currency] = (tips[a.currency] ?? 0) + (a.tipAmount ?? 0);
    }
    const expensesByCurrency: Record<string, number> = {};
    for (const e of expenses) {
      expensesByCurrency[e.currency] = (expensesByCurrency[e.currency] ?? 0) + e.amount;
    }
    const net: Record<string, number> = {};
    for (const c of new Set([
      ...Object.keys(income),
      ...Object.keys(expensesByCurrency),
      ...Object.keys(tips),
    ])) {
      net[c] = (income[c] ?? 0) + (tips[c] ?? 0) - (expensesByCurrency[c] ?? 0);
    }
    return {
      count: paidAppts.length,
      income,
      tips,
      expenses: expensesByCurrency,
      net,
    };
  }
}
