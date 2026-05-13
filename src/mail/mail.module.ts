import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { mailProviders } from './mail.providers';
import { DatabaseModule } from 'src/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { MailController } from './mail.controller';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [...mailProviders, MailService],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
