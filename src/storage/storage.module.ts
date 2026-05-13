import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  exports: [StorageService],
  controllers: [StorageController],
  providers: [StorageService],
})
export class StorageModule {}
