import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SqsModule } from '@ssut/nestjs-sqs';

@Global()
@Module({
  imports: [
    SqsModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        consumers: configService.get('sqs.consumers'),
        producers: configService.get('sqs.producers'),
      }),
    }),
  ],
  exports: [SqsModule],
})
export class AwsSqsModule {}
