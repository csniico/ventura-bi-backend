import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserModule } from 'src/user/user.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync(jwtConfig.asProvider())
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    LocalStrategy
  ],
})
export class AuthModule { }
