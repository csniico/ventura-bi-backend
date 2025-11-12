import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ShutdownService } from './shutdown.service';
import { PrismaService } from './prisma/prisma.service';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { PrismaModule } from 'nestjs-prisma';
import { PermissionModule } from './permission/permission.module';
import { RoleService } from './role/role.service';
import { RoleModule } from './role/role.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    PermissionModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [AppService, ShutdownService, PrismaService, RoleService],
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
