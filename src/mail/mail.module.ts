import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { mailProviders } from './mail.providers';
import { DatabaseModule } from 'src/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { MailController } from './mail.controller';
import { BullModule } from '@nestjs/bullmq';
import { MailProcessor } from 'src/mail/mail.processor';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    BullModule.registerQueue({ name: 'mail' }),
  ],
  providers: [...mailProviders, MailService, MailProcessor],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
