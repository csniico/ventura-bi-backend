import { Body, Controller, Post } from '@nestjs/common';
import { MailerService } from 'src/mailer/mailer.service';
import { SendMailDto } from 'src/mailer/dto/send-mail.dto';

@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('/send-email')
  async sendEmail(@Body() dto: SendMailDto) {
    return await this.mailerService.sendEmail(dto);
  }
}
