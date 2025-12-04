import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { SendMailDto } from './dto/send-mail.dto';
import { MAILER_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import Mail from 'nodemailer/lib/mailer';
import { MailOptions } from 'nodemailer/lib/sendmail-transport';

@Injectable()
export class MailerService {
  private transporter: Transporter;
  constructor(
    @Inject(MAILER_REPOSITORY)
    private mailRepository: Repository<Mail>,
    private configService: ConfigService,
  ) {
    this.transporter = createTransport({
      service: configService.get<string>('EMAIL_SERVICE', ''),
      auth: {
        user: configService.get<string>('EMAIL_USER', ''),
        pass: configService.get<string>('EMAIL_PASSWORD', ''),
      },
    });
  }

  async sendEmail(sendMailDto: SendMailDto) {
    const { to, htmlBody, subject, cc } = sendMailDto;
    if (!to) {
      throw new InternalServerErrorException('Recipient email is required.');
    }
    if (!htmlBody) {
      throw new InternalServerErrorException('Email body is required.');
    }
    if (!subject) {
      throw new InternalServerErrorException('Email subject is required.');
    }
    try {
      const mailOptions: MailOptions = {
        from: this.configService.get<string>('EMAIL_USER'),
        to: to,
        subject: subject,
        html: htmlBody,
        cc: cc,
        replyTo: this.configService.get<string>('MAIL_USER'),
      };
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.log(error);
      throw InternalServerErrorException;
    }
  }
}
