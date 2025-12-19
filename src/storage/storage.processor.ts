import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StorageService } from 'src/storage/storage.service';

@Processor('assets')
@Injectable()
export class StorageProcessor extends WorkerHost {
  private readonly logger = new Logger('StorageProcessor');
  constructor(private readonly storageService: StorageService) {
    super();
  }
  async process(job: Job): Promise<any> {
    this.logger.log(`Processing uploaded asset: ${job.name}`);
    switch (job.name) {
      case 'image-upload':
        return await this.uploadImage(job);
      default:
        break;
    }
  }

  private async uploadImage(job: Job) {
    const { buffer, key, mimetype } = job.data as {
      buffer: Buffer;
      mimetype: string;
      key: string;
    };
    try {
      const bufferFromJson = Buffer.from(buffer);
      return await this.storageService.uploadImageToBucket(
        bufferFromJson,
        key,
        mimetype,
      );
    } catch (error) {
      this.logger.error(`Uploading image ${job.name}`);
      this.logger.error(error);
      throw error;
    }
  }
}
