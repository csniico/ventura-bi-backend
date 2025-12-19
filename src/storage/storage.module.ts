import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { BullModule } from '@nestjs/bullmq';
import { StorageProcessor } from 'src/storage/storage.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'assets' })],
  exports: [StorageService],
  controllers: [StorageController],
  providers: [StorageService, StorageProcessor],
})
export class StorageModule {}
