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
import { nanoid } from 'nanoid';
import {
  EmailVerificationTemplate,
  VERIFICATION_EMAIL_SUBJECT,
} from './templates/email-verification-template';

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

  private async sendEmail(sendMailDto: SendMailDto) {
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
        replyTo: this.configService.get<string>('MAIL_USER'),
      };
      if (cc && cc !== '') {
        mailOptions.cc = cc;
      }
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.log(error);
      throw InternalServerErrorException;
    }
  }

  private generateEmailVerificationTemplate(
    firstName: string,
    verificationCode: string,
    expirationMinutes: number,
  ) {
    return EmailVerificationTemplate(
      firstName,
      verificationCode,
      expirationMinutes,
    );
  }

  private generateWelcomeEmailTemplate() {}

  private generateEmailVerificationCode() {
    try {
      return nanoid(6);
    } catch (error: unknown) {
      console.error({
        message: 'Error generating email verification code',
        error,
      });

      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  }

  async sendVerificationEmail(firstName: string, recipientEmail: string) {
    if (!firstName) {
      throw new Error('firstName is required');
    }
    if (!recipientEmail) {
      throw new Error('recipientEmail is required');
    }
    try {
      const code = this.generateEmailVerificationCode();
      const subject = VERIFICATION_EMAIL_SUBJECT;
      const template = this.generateEmailVerificationTemplate(
        firstName,
        code,
        10,
      );

      await this.sendEmail({
        htmlBody: template,
        subject: subject,
        to: recipientEmail,
      });
    } catch (error: unknown) {
      console.error({
        message: 'Error sending verification email',
        error,
      });
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }
}
