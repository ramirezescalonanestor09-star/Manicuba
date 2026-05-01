import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { normalizePhone, type LoginInput, type RegisterInput } from '@manicuba/shared';

import { PrismaService } from '../common/prisma.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterInput) {
    const slug = input.slug.toLowerCase();
    const email = input.email.toLowerCase();
    const phoneE164 = normalizePhone(input.phone);

    const [slugTaken, emailTaken] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { slug } }),
      this.prisma.user.findUnique({ where: { email } }),
    ]);
    if (slugTaken) throw new ConflictException('El enlace publico ya esta tomado');
    if (emailTaken) throw new ConflictException('El correo ya esta registrado');

    const passwordHash = await argon2.hash(input.password);

    const tenant = await this.prisma.tenant.create({
      data: {
        slug,
        businessName: input.businessName,
        ownerName: input.ownerName,
        phoneE164,
        email,
        defaultCurrency: input.defaultCurrency ?? 'CUP',
        timezone: input.timezone ?? 'America/Havana',
        users: {
          create: {
            email,
            phoneE164,
            passwordHash,
            name: input.ownerName,
            role: 'OWNER',
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    const tokens = await this.issueTokens(user.id, tenant.id, user.role, user.email);
    return {
      tokens,
      tenant: { id: tenant.id, slug: tenant.slug, businessName: tenant.businessName },
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async login(input: LoginInput) {
    const email = input.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) throw new UnauthorizedException('Credenciales invalidas');

    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedException('Credenciales invalidas');

    const tenant = await this.prisma.tenant.findUnique({ where: { id: user.tenantId } });
    if (!tenant) throw new UnauthorizedException('Tenant no encontrado');

    const tokens = await this.issueTokens(user.id, tenant.id, user.role, user.email);
    return {
      tokens,
      tenant: { id: tenant.id, slug: tenant.slug, businessName: tenant.businessName },
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    if (!refreshToken) throw new BadRequestException('Token requerido');
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh invalido');
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(
      stored.user.id,
      stored.user.tenantId,
      stored.user.role,
      stored.user.email,
    );
  }

  private async issueTokens(
    userId: string,
    tenantId: string,
    role: 'OWNER' | 'STAFF',
    email: string,
  ): Promise<TokenPair> {
    const accessTtl = Number(this.config.get('JWT_ACCESS_TTL') ?? 900);
    const refreshTtl = Number(this.config.get('JWT_REFRESH_TTL') ?? 60 * 60 * 24 * 30);

    const accessToken = await this.jwt.signAsync(
      { sub: userId, tid: tenantId, role, email },
      {
        secret: this.config.get('JWT_ACCESS_SECRET') ?? 'change-me-access',
        expiresIn: accessTtl,
      },
    );

    const refreshTokenRaw = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshTokenRaw);
    const expiresAt = new Date(Date.now() + refreshTtl * 1000);
    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });

    return { accessToken, refreshToken: refreshTokenRaw, expiresIn: accessTtl };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
