import { Module } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { ResourceController } from './resource.controller';
import { resourceProviders } from './resource.provider';
import { BusinessModule } from 'src/business/business.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule, BusinessModule],
  controllers: [ResourceController],
  providers: [...resourceProviders, ResourceService],
})
export class ResourceModule {}
