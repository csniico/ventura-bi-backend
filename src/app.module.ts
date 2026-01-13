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
import { CustomerModule } from './customer/customer.module';
import { ResourceModule } from './resource/resource.module';
import { OrderModule } from './order/order.module';
import { InvoiceModule } from './invoice/invoice.module';

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
    CustomerModule,
    ResourceModule,
    OrderModule,
    InvoiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
