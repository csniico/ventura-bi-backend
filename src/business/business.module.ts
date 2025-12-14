import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { businessProviders } from 'src/business/business.provider';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BusinessController],
  providers: [...businessProviders, BusinessService],
})
export class BusinessModule {}
