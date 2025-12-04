import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { userProviders } from './user.providers';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [DatabaseModule, MailerModule],
  controllers: [UserController],
  providers: [...userProviders, UserService],
  exports: [UserService, ...userProviders],
})
export class UserModule {}
