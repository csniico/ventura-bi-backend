import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logging.middleware';
import { AppointmentModule } from './appointment/appointment.module';
import { BusinessModule } from './business/business.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from 'src/mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URI'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
        // prefix: configService.get<string>('QUEUE_PREFIX') || 'ventura',
        defaultJobOptions: {
          removeOnComplete: { age: 8400 },
          attempts: 3,
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AppointmentModule,
    BusinessModule,
    AuthModule,
    MailModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
