import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { userProviders } from './user.providers';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [DatabaseModule, MailModule],
  controllers: [UserController],
  providers: [...userProviders, UserService],
  exports: [UserService, ...userProviders],
})
export class UserModule {}
