import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { mailerProviders } from './mailer.providers';
import { DatabaseModule } from 'src/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { MailerController } from './mailer.controller';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [...mailerProviders, MailerService],
  exports: [MailerService],
  controllers: [MailerController],
})
export class MailerModule {}
