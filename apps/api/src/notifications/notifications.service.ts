import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import * as nodemailer from 'nodemailer';

import { PrismaService } from '../common/prisma.service';

export type NotifChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'TELEGRAM' | 'INAPP';

export interface NotifyInput {
  tenantId: string;
  channel: NotifChannel;
  to: string;
  subject?: string;
  body: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private mailer?: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.mailer = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') ?? 587),
        auth: this.config.get('SMTP_USER')
          ? {
              user: this.config.get<string>('SMTP_USER'),
              pass: this.config.get<string>('SMTP_PASS'),
            }
          : undefined,
      });
    }
  }

  async send(input: NotifyInput) {
    const record = await this.prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        channel: input.channel,
        to: input.to,
        payload: {
          subject: input.subject ?? null,
          body: input.body,
          meta: (input.meta ?? {}) as Prisma.InputJsonValue,
        },
      },
    });

    try {
      if (input.channel === 'EMAIL' && this.mailer) {
        await this.mailer.sendMail({
          from: this.config.get('SMTP_FROM') ?? 'Manicuba <no-reply@manicuba.app>',
          to: input.to,
          subject: input.subject ?? 'Manicuba',
          text: input.body,
        });
      } else if (input.channel === 'SMS') {
        const driver = (this.config.get<string>('SMS_DRIVER') ?? 'noop').toLowerCase();
        if (driver === 'cubacel') {
          const url = this.config.get<string>('SMS_CUBACEL_API_URL');
          const key = this.config.get<string>('SMS_CUBACEL_API_KEY');
          if (!url || !key) throw new Error('SMS_CUBACEL_API_URL/KEY no configurados');
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
            body: JSON.stringify({ to: input.to, text: input.body }),
          });
          if (!r.ok) throw new Error(`Cubacel error ${r.status}`);
        } else {
          this.logger.log(`SMS noop → ${input.to}: ${input.body}`);
        }
      } else {
        // WHATSAPP, TELEGRAM, INAPP: deep links / ya en BD.
        this.logger.log(`Notification ${input.channel} → ${input.to} (logged)`);
      }
      await this.prisma.notification.update({
        where: { id: record.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      await this.prisma.notification.update({
        where: { id: record.id },
        data: { status: 'FAILED', error: message },
      });
      this.logger.error(`Notification ${input.channel} failed: ${message}`);
    }

    return record;
  }
}
