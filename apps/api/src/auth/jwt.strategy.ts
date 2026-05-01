import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  tid: string;
  role: 'OWNER' | 'STAFF';
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      tenantId: payload.tid,
      role: payload.role,
      email: payload.email,
    };
  }
}
