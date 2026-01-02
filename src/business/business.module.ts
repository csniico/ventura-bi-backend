import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { businessProviders } from 'src/business/business.provider';
import { DatabaseModule } from 'src/database/database.module';
import { UserService } from 'src/user/user.service';
import { userProviders } from 'src/user/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [BusinessController],
  providers: [
    ...businessProviders,
    ...userProviders,
    BusinessService,
    UserService,
  ],
  exports: [BusinessService, ...businessProviders],
})
export class BusinessModule {}
