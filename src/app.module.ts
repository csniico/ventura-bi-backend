import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logging.middleware';
import { InvoiceModule } from './invoice/invoice.module';
import { AppointmentModule } from './appointment/appointment.module';
import { InventoryModule } from './inventory/inventory.module';
import { CustomerModule } from './customer/customer.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    UserModule,
    InvoiceModule,
    AppointmentModule,
    InventoryModule,
    CustomerModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
