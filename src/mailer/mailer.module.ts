import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { mailerProviders } from './mailer.providers';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [...mailerProviders, MailerService],
  exports: [MailerService],
})
export class MailerModule {}
