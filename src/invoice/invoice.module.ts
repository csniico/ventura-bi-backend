import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { invoiceProviders } from './invoice.provider';
import { DatabaseModule } from 'src/database/database.module';
import { BusinessModule } from 'src/business/business.module';
import { CustomerModule } from 'src/customer/customer.module';
import { OrderModule } from 'src/order/order.module';

@Module({
  imports: [DatabaseModule, BusinessModule, CustomerModule, OrderModule],
  controllers: [InvoiceController],
  providers: [...invoiceProviders, InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
