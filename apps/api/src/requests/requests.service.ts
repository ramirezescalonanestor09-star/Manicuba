import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import {
  buildQuoteMessage,
  formatAmount,
  normalizePhone,
  type PublicRequestCreateInput,
  type QuoteCreateInput,
} from '@manicuba/shared';

import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ImagePipeline } from '../uploads/image.pipeline';
import { AvailabilityService } from '../availability/availability.service';
import { RemindersService } from '../jobs/reminders.service';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifs: NotificationsService,
    private readonly imagePipeline: ImagePipeline,
    private readonly config: ConfigService,
    private readonly availability: AvailabilityService,
    private readonly reminders: RemindersService,
    private readonly audit: AuditService,
  ) {}

  async createPublic(
    tenantSlug: string,
    input: PublicRequestCreateInput,
    files: Express.Multer.File[],
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Manicuri no encontrada');
    if (files.length > 5) throw new ConflictException('Maximo 5 fotos');

    const phone = normalizePhone(input.phone);
    const client = await this.prisma.client.upsert({
      where: { tenantId_phoneE164: { tenantId: tenant.id, phoneE164: phone } },
      update: { fullName: input.fullName, email: input.email ?? undefined },
      create: {
        tenantId: tenant.id,
        fullName: input.fullName,
        phoneE164: phone,
        email: input.email,
      },
    });

    const publicToken = nanoid(24);

    const processedImages = await Promise.all(
      files.map((f) => this.imagePipeline.processBuffer(f.buffer)),
    );

    const request = await this.prisma.serviceRequest.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        serviceId: input.serviceId,
        publicToken,
        description: input.description,
        allergiesNote: input.allergiesNote,
        budgetEstimate: input.budgetEstimate,
        preferredCurrency: input.preferredCurrency,
        preferredChannel: input.preferredChannel,
        requestedSlot: input.requestedSlot ? new Date(input.requestedSlot) : undefined,
        images: {
          create: processedImages.map((p) => ({
            storageKey: p.storageKey,
            mime: p.mime,
            width: p.width,
            height: p.height,
            size: p.size,
          })),
        },
        thread: {
          create: {
            tenantId: tenant.id,
            clientId: client.id,
            publicToken: nanoid(24),
            lastMessageAt: new Date(),
          },
        },
      },
      include: { images: true, thread: true },
    });

    await this.notifs.send({
      tenantId: tenant.id,
      channel: 'EMAIL',
      to: tenant.email,
      subject: `Nueva solicitud de ${client.fullName}`,
      body: `Tienes una nueva solicitud personalizada de ${client.fullName} (${phone}).\n\nDetalle: ${input.description}\n\nRevisalo en tu panel.`,
    });

    return {
      requestId: request.id,
      publicToken,
      threadToken: request.thread?.publicToken,
      publicUrl: this.publicRequestUrl(publicToken),
    };
  }

  async getByPublicToken(token: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { publicToken: token },
      include: {
        tenant: {
          select: { businessName: true, ownerName: true, phoneE164: true, slug: true },
        },
        client: { select: { fullName: true, phoneE164: true, email: true } },
        images: true,
        quote: true,
        thread: { select: { id: true, publicToken: true } },
      },
    });
    if (!request) throw new NotFoundException();
    return request;
  }

  async listForTenant(tenantId: string, status?: string) {
    return this.prisma.serviceRequest.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        client: { select: { id: true, fullName: true, phoneE164: true } },
        images: { take: 1 },
        quote: { select: { amount: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getForTenant(tenantId: string, id: string) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        images: true,
        quote: true,
        thread: true,
        service: true,
      },
    });
    if (!request) throw new NotFoundException();
    return request;
  }

  async setStatus(tenantId: string, id: string, status: string) {
    const owned = await this.prisma.serviceRequest.findFirst({ where: { id, tenantId } });
    if (!owned) throw new NotFoundException();
    return this.prisma.serviceRequest.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async createQuote(tenantId: string, id: string, input: QuoteCreateInput) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, tenantId },
      include: { client: true, tenant: true },
    });
    if (!request) throw new NotFoundException();

    const quote = await this.prisma.quote.upsert({
      where: { requestId: request.id },
      create: {
        requestId: request.id,
        amount: input.amount,
        currency: input.currency,
        message: input.message,
        validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      },
      update: {
        amount: input.amount,
        currency: input.currency,
        message: input.message,
        validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
        sentAt: new Date(),
      },
    });

    await this.prisma.serviceRequest.update({
      where: { id: request.id },
      data: { status: 'QUOTED' },
    });
    await this.audit.log({
      tenantId,
      action: 'CREATE_QUOTE',
      entity: 'Quote',
      entityId: quote.id,
      metadata: { requestId: request.id, amount: input.amount, currency: input.currency },
    });

    const message = buildQuoteMessage({
      clientName: request.client.fullName,
      manicuriName: request.tenant.businessName,
      amountFormatted: formatAmount(input.amount, input.currency),
      publicUrl: this.publicRequestUrl(request.publicToken),
      validUntil: input.validUntil
        ? new Date(input.validUntil).toLocaleDateString('es-CU')
        : undefined,
      customMessage: input.message,
    });

    return {
      quote,
      preview: { message, publicUrl: this.publicRequestUrl(request.publicToken) },
    };
  }

  async decision(token: string, decision: 'ACCEPT' | 'REJECT') {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { publicToken: token },
      include: { quote: true },
    });
    if (!request || !request.quote) throw new NotFoundException();

    if (decision === 'REJECT') {
      await this.prisma.$transaction([
        this.prisma.quote.update({
          where: { requestId: request.id },
          data: { rejectedAt: new Date() },
        }),
        this.prisma.serviceRequest.update({
          where: { id: request.id },
          data: { status: 'REJECTED' },
        }),
      ]);
      return { status: 'REJECTED' };
    }

    const start = request.requestedSlot ?? new Date(Date.now() + 24 * 3600 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    await this.availability.assertSlotFree(request.tenantId, start, end);

    const [, , appointment] = await this.prisma.$transaction([
      this.prisma.quote.update({
        where: { requestId: request.id },
        data: { acceptedAt: new Date() },
      }),
      this.prisma.serviceRequest.update({
        where: { id: request.id },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.appointment.create({
        data: {
          tenantId: request.tenantId,
          clientId: request.clientId,
          serviceId: request.serviceId,
          requestId: request.id,
          startAt: start,
          endAt: end,
          status: 'CONFIRMED',
          priceFinal: request.quote.amount,
          currency: request.quote.currency,
        },
      }),
    ]);

    const jobId = await this.reminders.scheduleAppointment(appointment.id, start);
    if (jobId) {
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderJobId: jobId },
      });
    }
    await this.audit.log({
      tenantId: request.tenantId,
      action: 'ACCEPT_QUOTE',
      entity: 'ServiceRequest',
      entityId: request.id,
      metadata: { appointmentId: appointment.id },
    });

    return { status: 'ACCEPTED', appointmentId: appointment.id };
  }

  private publicRequestUrl(token: string): string {
    const base = this.config.get<string>('WEB_PUBLIC_URL') ?? 'http://localhost:3000';
    return `${base}/r/${token}`;
  }
}
