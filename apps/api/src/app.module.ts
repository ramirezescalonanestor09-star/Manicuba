import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ClientsModule } from './clients/clients.module';
import { ServicesModule } from './services/services.module';
import { RequestsModule } from './requests/requests.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { UploadsModule } from './uploads/uploads.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GalleryModule } from './gallery/gallery.module';
import { PublicModule } from './public/public.module';
import { JobsModule } from './jobs/jobs.module';
import { CashModule } from './cash/cash.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
      { name: 'public', ttl: 60_000, limit: 30 },
    ]),
    PrismaModule,
    JobsModule,
    NotificationsModule,
    UploadsModule,
    AvailabilityModule,
    AuthModule,
    TenantsModule,
    ClientsModule,
    ServicesModule,
    RequestsModule,
    AppointmentsModule,
    MessagingModule,
    GalleryModule,
    CashModule,
    TemplatesModule,
    PublicModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
