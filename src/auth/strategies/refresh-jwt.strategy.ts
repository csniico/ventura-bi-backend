import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { refreshTokenCookieExtractor } from '../utils/cookie-extractor';
import {
  Inject,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { Request } from 'express';

export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  private readonly logger = new Logger('JwtStrategy');
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private readonly authService: AuthService,
  ) {
    if (!refreshJwtConfiguration.secret) {
      throw new InternalServerErrorException(
        'jwtConfiguration cannot find secret value or secret is undefined.',
      );
    }
    super({
      jwtFromRequest: refreshTokenCookieExtractor,
      secretOrKey: refreshJwtConfiguration.secret as string,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  /**
   * if the passport strategy finds the refresh token in the cookies and the refresh
   * token is not expired, it will call the validate function and pass the payload to
   * the function
   * @param payload the results of decrypting the refresh jwt token {sub: 'userId'}
   * @param req the request object imported from express
   * @returns user id
   */
  async validate(req: Request, payload: { sub: string }) {
    const refreshToken = refreshTokenCookieExtractor(req);
    const userId = payload.sub;

    if (!refreshToken || !userId) {
      this.logger.warn(
        `Jwt validation. User is unauthorized or does not exist`,
      );
      throw new UnauthorizedException();
    }

    const isAuthorized = await this.authService.verifyRefreshToken({
      userId,
      refreshToken,
    });

    if (!isAuthorized) {
      this.logger.warn(
        `Jwt validation. User is unauthorized or does not exist`,
      );
      throw new UnauthorizedException();
    }

    return { userId };
  }
}
