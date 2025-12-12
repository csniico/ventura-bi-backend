import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { SendMailDto } from 'src/mail/dto/send-mail.dto';

@Controller('mailer')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('/send-email')
  async sendEmail(@Body() dto: SendMailDto) {
    await this.mailService.sendVerificationCode({
      email: dto.recipients[0],
      firstName: 'Kelvin',
    });
  }
}
