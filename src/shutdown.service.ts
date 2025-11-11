import {
  Injectable,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';

@Injectable()
export class ShutdownService implements OnModuleDestroy, OnApplicationShutdown {
  async onModuleDestroy() {
    console.log('Module is being destroyed -  cleaning up...');
    // disconnect from database and cleanup
  }

  async onApplicationShutdown(signal?: string) {
    console.log(`Application shutdown signal received: ${signal}`);
    // disconnect from database and cleanup
  }
}
