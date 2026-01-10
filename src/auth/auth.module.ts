import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserModule } from 'src/user/user.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { MailModule } from 'src/mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import refreshJwtConfig from './config/refresh-jwt.config';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUri = config.get<string>('REDIS_URI') || 'localhost:6379';
        const [host, port] = redisUri.split(':');
        return {
          errorMessage:
            'Too many sign-in attempts. Your account has been temporarily locked. Please try again in 15 minutes.',
          storage: new ThrottlerStorageRedisService(
            new Redis({
              host,
              port: parseInt(port, 10) || 6379,
              password: config.get<string>('REDIS_PASSWORD'),
            }),
          ),
          throttlers: [
            {
              name: 'login',
              limit: 15,
              ttl: 60 * 60 * 1000,
              blockDuration: 15 * 60 * 1000,
            },
          ],
        };
      },
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    LocalStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AuthModule {}
