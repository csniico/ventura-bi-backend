import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logging.middleware';
import { InvoiceModule } from './invoice/invoice.module';
import { AppointmentModule } from './appointment/appointment.module';
import { CustomerModule } from './customer/customer.module';
import { OrderModule } from './order/order.module';
import { BusinessModule } from './business/business.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from 'src/mail/mail.module';
import { BullModule } from '@nestjs/bullmq';

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
    InvoiceModule,
    AppointmentModule,
    CustomerModule,
    OrderModule,
    BusinessModule,
    ProductModule,
    AuthModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
