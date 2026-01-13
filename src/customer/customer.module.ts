import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { customerProviders } from './customer.provider';
import { BusinessModule } from 'src/business/business.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule, BusinessModule],
  controllers: [CustomerController],
  providers: [...customerProviders, CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
