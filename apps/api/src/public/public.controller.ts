import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  messageCreateSchema,
  publicRequestCreateSchema,
  quoteDecisionSchema,
  type MessageCreateInput,
  type PublicRequestCreateInput,
  type QuoteDecisionInput,
} from '@manicuba/shared';

import { ZodValidationPipe } from '../common/zod.pipe';
import { PrismaService } from '../common/prisma.service';
import { RequestsService } from '../requests/requests.service';
import { MessagingService } from '../messaging/messaging.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requests: RequestsService,
    private readonly messaging: MessagingService,
  ) {}

  @Get('tenants/:slug')
  async getTenant(@Param('slug') slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        slug: true,
        businessName: true,
        ownerName: true,
        bio: true,
        defaultCurrency: true,
        timezone: true,
        services: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            description: true,
            durationMin: true,
            priceCUP: true,
            priceMLC: true,
            priceUSD: true,
            coverImage: true,
          },
        },
        galleryItems: {
          where: { isPublic: true },
          take: 24,
          orderBy: { createdAt: 'desc' },
          select: { id: true, storageKey: true, caption: true, tags: true },
        },
      },
    });
    if (!tenant) throw new NotFoundException();
    return tenant;
  }

  @Throttle({ public: { limit: 10, ttl: 60_000 } })
  @Post('tenants/:slug/requests')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async createRequest(
    @Param('slug') slug: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('payload') payloadRaw: string,
  ) {
    if (!payloadRaw) throw new BadRequestException('payload requerido');
    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadRaw);
    } catch {
      throw new BadRequestException('payload no es JSON valido');
    }
    const validation = publicRequestCreateSchema.safeParse(parsed);
    if (!validation.success) {
      throw new BadRequestException({
        message: 'Datos invalidos',
        issues: validation.error.flatten(),
      });
    }
    const input: PublicRequestCreateInput = validation.data;
    return this.requests.createPublic(slug, input, files ?? []);
  }

  @Get('requests/:token')
  getRequest(@Param('token') token: string) {
    return this.requests.getByPublicToken(token);
  }

  @Post('requests/:token/decision')
  decision(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(quoteDecisionSchema)) body: QuoteDecisionInput,
  ) {
    return this.requests.decision(token, body.decision);
  }

  @Get('threads/:token/messages')
  listMessages(@Param('token') token: string) {
    return this.messaging.listByPublicToken(token);
  }

  @Throttle({ public: { limit: 30, ttl: 60_000 } })
  @Post('threads/:token/messages')
  postMessage(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(messageCreateSchema)) body: MessageCreateInput,
  ) {
    return this.messaging.postFromClient(token, body.body);
  }
}
