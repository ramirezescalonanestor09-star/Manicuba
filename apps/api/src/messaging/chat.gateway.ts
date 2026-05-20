import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../common/prisma.service';
import { MessagingService } from './messaging.service';

interface SocketContext {
  tenantId?: string;
  userId?: string;
  publicThreadToken?: string;
}

@WebSocketGateway({ cors: { origin: true }, path: '/ws' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  private contexts = new WeakMap<Socket, SocketContext>();

  @WebSocketServer() server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(socket: Socket) {
    const ctx: SocketContext = {};
    const token = socket.handshake.auth?.token as string | undefined;
    const publicToken = socket.handshake.auth?.publicToken as string | undefined;

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync(token, {
          secret: this.config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
        });
        ctx.tenantId = payload.tid;
        ctx.userId = payload.sub;
      } catch {
        socket.disconnect(true);
        return;
      }
    } else if (publicToken) {
      const thread = await this.prisma.messageThread.findUnique({
        where: { publicToken },
        select: { id: true, tenantId: true },
      });
      if (!thread) {
        socket.disconnect(true);
        return;
      }
      ctx.publicThreadToken = publicToken;
      ctx.tenantId = thread.tenantId;
      socket.join(`thread:${thread.id}`);
    } else {
      socket.disconnect(true);
      return;
    }
    this.contexts.set(socket, ctx);
  }

  handleDisconnect(socket: Socket) {
    this.contexts.delete(socket);
  }

  @SubscribeMessage('join-thread')
  async joinThread(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { threadId: string },
  ) {
    const ctx = this.contexts.get(socket);
    if (!ctx?.tenantId) return { ok: false };
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: body.threadId, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!thread) return { ok: false };
    socket.join(`thread:${thread.id}`);
    return { ok: true };
  }

  @SubscribeMessage('send-message')
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { threadId?: string; body: string },
  ) {
    const ctx = this.contexts.get(socket);
    if (!ctx) return { ok: false };
    const text = (body.body ?? '').trim();
    if (!text) return { ok: false };

    let message;
    let threadId: string | undefined;
    if (ctx.publicThreadToken) {
      message = await this.messaging.postFromClient(ctx.publicThreadToken, text);
      threadId = message.threadId;
    } else if (ctx.tenantId && body.threadId) {
      message = await this.messaging.postFromManicuri(ctx.tenantId, body.threadId, text);
      threadId = message.threadId;
    } else {
      return { ok: false };
    }
    this.server.to(`thread:${threadId}`).emit('new-message', message);
    return { ok: true, message };
  }
}
