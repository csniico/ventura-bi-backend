import { ConfigService, registerAs } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { StringValue } from './jwt.config';
import { InternalServerErrorException, Logger } from '@nestjs/common';

export default registerAs('refreshjwt', (): JwtSignOptions => {
  const logger = new Logger('RefreshJwtConfig');
  const configService = new ConfigService();
  const refreshJwtSecret = configService.get<string>('REFRESH_JWT_SECRET');
  const refreshJwtExpiresIn = configService.get<StringValue>(
    'REFRESH_JWT_EXPIRES_IN',
  );

  if (!refreshJwtSecret || !refreshJwtExpiresIn) {
    logger.error(
      'Missing config variables in - REFRESH_JWT_SECRET | REFRESH_JWT_EXPIRES_IN',
    );
    throw new InternalServerErrorException('Server Configuration error.');
  }
  return {
    secret: refreshJwtSecret,
    expiresIn: refreshJwtExpiresIn,
  };
});
