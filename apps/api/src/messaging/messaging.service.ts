import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ImagePipeline } from '../uploads/image.pipeline';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imagePipeline: ImagePipeline,
  ) {}

  async listByPublicToken(token: string) {
    const thread = await this.prisma.messageThread.findUnique({
      where: { publicToken: token },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true },
        },
      },
    });
    if (!thread) throw new NotFoundException();
    return thread;
  }

  async listForTenant(tenantId: string, threadId: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: threadId, tenantId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, include: { attachments: true } },
        client: true,
      },
    });
    if (!thread) throw new NotFoundException();
    return thread;
  }

  async postFromClient(token: string, body: string) {
    const thread = await this.prisma.messageThread.findUnique({ where: { publicToken: token } });
    if (!thread) throw new NotFoundException();
    const message = await this.prisma.message.create({
      data: { threadId: thread.id, fromType: 'CLIENT', body },
      include: { attachments: true },
    });
    await this.prisma.messageThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    });
    return message;
  }

  async postFromManicuri(
    tenantId: string,
    threadId: string,
    body: string,
    files: Express.Multer.File[] = [],
  ) {
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: threadId, tenantId },
    });
    if (!thread) throw new NotFoundException();
    const attachments = await Promise.all(
      files.map((f) => this.imagePipeline.processBuffer(f.buffer)),
    );
    const message = await this.prisma.message.create({
      data: {
        threadId: thread.id,
        fromType: 'MANICURI',
        body,
        attachments: {
          create: attachments.map((a) => ({
            storageKey: a.storageKey,
            mime: a.mime,
            width: a.width,
            height: a.height,
            size: a.size,
          })),
        },
      },
      include: { attachments: true },
    });
    await this.prisma.messageThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    });
    return message;
  }

  async listThreadsForTenant(tenantId: string) {
    return this.prisma.messageThread.findMany({
      where: { tenantId },
      include: {
        client: { select: { fullName: true, phoneE164: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { attachments: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
  }
}
