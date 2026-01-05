import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { accessTokenCookieExtractor } from '../utils/cookie-extractor';
import {
  Inject,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import jwtConfig from '../config/jwt.config';
import type { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';

export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger('JwtStrategy');
  constructor(
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly authService: AuthService,
  ) {
    if (!jwtConfiguration.secret) {
      throw new InternalServerErrorException(
        'jwtConfiguration cannot find secret value or secret is undefined.',
      );
    }
    super({
      jwtFromRequest: accessTokenCookieExtractor,
      secretOrKey: jwtConfiguration.secret as string,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string }) {
    const isAuthorized = await this.authService.verifyJwtPayload({
      userId: payload.sub,
    });
    if (!isAuthorized) {
      this.logger.warn(`Jwt validation. User is unauthorized`);
      throw new UnauthorizedException();
    }
    return { userId: payload.sub };
  }
}
