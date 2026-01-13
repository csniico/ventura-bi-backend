import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { orderProviders } from './order.providers';
import { DatabaseModule } from 'src/database/database.module';
import { BusinessModule } from 'src/business/business.module';
import { ResourceModule } from 'src/resource/resource.module';
import { CustomerModule } from 'src/customer/customer.module';

@Module({
  imports: [DatabaseModule, BusinessModule, ResourceModule, CustomerModule],
  controllers: [OrderController],
  providers: [...orderProviders, OrderService],
  exports: [OrderService],
})
export class OrderModule {}
