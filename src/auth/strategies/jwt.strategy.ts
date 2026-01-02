import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { accessTokenCookieExtractor } from '../utils/cookie-extractor';
import {
  Inject,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import jwtConfig from '../config/jwt.config';
import type { ConfigType } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly userService: UserService,
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
    const isValidUser = await this.userService.validateUserId(payload.sub);
    if (!isValidUser) {
      throw new UnauthorizedException('User validation failed.');
    }
    return { userId: payload.sub };
  }
}
