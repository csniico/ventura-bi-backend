import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { OrderModule } from 'src/order/order.module';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { CustomerModule } from 'src/customer/customer.module';
import { ResourceModule } from 'src/resource/resource.module';

@Module({
  imports: [OrderModule, InvoiceModule, CustomerModule, ResourceModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
