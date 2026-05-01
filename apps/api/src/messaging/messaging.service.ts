import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async listByPublicToken(token: string) {
    const thread = await this.prisma.messageThread.findUnique({
      where: { publicToken: token },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!thread) throw new NotFoundException();
    return thread;
  }

  async listForTenant(tenantId: string, threadId: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: threadId, tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' } }, client: true },
    });
    if (!thread) throw new NotFoundException();
    return thread;
  }

  async postFromClient(token: string, body: string) {
    const thread = await this.prisma.messageThread.findUnique({ where: { publicToken: token } });
    if (!thread) throw new NotFoundException();
    const message = await this.prisma.message.create({
      data: { threadId: thread.id, fromType: 'CLIENT', body },
    });
    await this.prisma.messageThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    });
    return message;
  }

  async postFromManicuri(tenantId: string, threadId: string, body: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: threadId, tenantId },
    });
    if (!thread) throw new NotFoundException();
    const message = await this.prisma.message.create({
      data: { threadId: thread.id, fromType: 'MANICURI', body },
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
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
  }
}
