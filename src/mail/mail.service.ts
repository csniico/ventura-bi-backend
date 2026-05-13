import { Inject, Injectable, Logger } from '@nestjs/common';
import { MAILER_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import { customAlphabet } from 'nanoid';
import { Mail, MailStatus } from 'src/mail/entities/mail.entity';
import {
  EmailVerificationTemplate,
  VERIFICATION_EMAIL_SUBJECT,
} from 'src/mail/templates/email-verification-template';
import { VerifyCodeDto } from 'src/mail/dto/verify-code.dto';
import {
  WELCOME_EMAIL_SUBJECT,
  WelcomeEmailTemplate,
} from 'src/mail/templates/welcome-template';
import { SendMailDto } from 'src/mail/dto/send-mail.dto';
import { Resend } from 'resend';
import {
  ALREADY_REGISTERED_SUBJECT,
  ExistingUserSignupTemplate,
} from 'src/mail/templates/existing-user-signup-template';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend = new Resend(process.env.RESEND_API_KEY);
  private readonly RESEND_FROM_EMAIL = 'Ventura <nii@support.csniico.com>';
  constructor(
    @Inject(MAILER_REPOSITORY)
    private mailRepository: Repository<Mail>,
    private readonly configService: ConfigService,
  ) {}

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

  private generateExistingUserSignUpTemplate(firstName: string) {
    const loginUrl = this.configService.get<string>('APP_LOGIN_URL');
    const resetUrl = this.configService.get<string>('APP_RESET_PASSWORD_URL');
    return ExistingUserSignupTemplate(firstName, loginUrl, resetUrl);
  }

  private generateWelcomeEmailTemplate(firstName: string) {
    return WelcomeEmailTemplate(firstName);
  }

  async sendEmail(dto: SendMailDto) {
    const { data, error } = await this.resend.emails.send({
      to: dto.recipients.toString(),
      from: this.RESEND_FROM_EMAIL,
      subject: dto.subject,
      html: dto.htmlBody,
    });

    if (error) {
      this.logger.error(error);
    }
    const mail = this.mailRepository.create({
      to: dto.recipients.toString(),
      subject: dto.subject,
      from: this.RESEND_FROM_EMAIL,
      htmlBody: dto.htmlBody,
      status: MailStatus.SENT,
    });
    await this.mailRepository.save(mail);
    return data;
  }

  async getMailById(id: string) {
    const mail = await this.mailRepository.findOne({ where: { shortId: id } });
    if (!mail) {
      return null;
    }
    return mail;
  }

  async updateMailStatus(mailId: string, status: MailStatus, options = {}) {
    if (!mailId) {
      throw new Error('mailId is required');
    }
    if (!status) {
      throw new Error('status is required');
    }
    try {
      const mail = await this.mailRepository.findOne({
        where: { shortId: mailId },
      });
      if (!mail) {
        return new Error(`mail with id ${mailId} not found.`);
      }
      if (options && Object.keys(options).length > 0) {
        mail.metadata = { ...mail.metadata, options };
      }
      mail.status = status;
      await this.mailRepository.save(mail);
      return mail;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage);
    }
  }

  async sendVerificationCode({
    email,
    firstName,
    status,
  }: {
    email: string;
    firstName: string;
    status: 'NEW' | 'EXISTING';
  }) {
    const verificationCode = this.generateEmailVerificationCode();
    const htmlBody =
      status === 'NEW'
        ? this.generateEmailVerificationTemplate(
            firstName,
            verificationCode,
            10,
          )
        : this.generateExistingUserSignUpTemplate(firstName);

    const { data, error } = await this.resend.emails.send({
      from: this.RESEND_FROM_EMAIL,
      to: email,
      subject:
        status === 'NEW'
          ? VERIFICATION_EMAIL_SUBJECT
          : ALREADY_REGISTERED_SUBJECT,
      html: htmlBody!,
    });

    this.logger.error(error);
    this.logger.log(data);

    const mail = this.mailRepository.create({
      to: email,
      subject:
        status === 'NEW'
          ? VERIFICATION_EMAIL_SUBJECT
          : ALREADY_REGISTERED_SUBJECT,
      verificationCode: verificationCode,
      htmlBody: htmlBody!,
      status: MailStatus.SENT,
    });
    await this.mailRepository.save(mail);

    return {
      message: 'Verification code sent',
      id: mail.shortId,
    };
  }

  async validateVerificationCode(dto: VerifyCodeDto & { firstName: string }) {
    let mail: Mail | null;
    if (dto.shortToken.trim() === 'login') {
      mail = await this.mailRepository.findOne({
        where: {
          to: dto.email.trim(),
          verificationCode: dto.code.trim(),
        },
      });
    } else {
      mail = await this.mailRepository.findOne({
        where: {
          shortId: dto.shortToken.trim(),
          to: dto.email.trim(),
          verificationCode: dto.code.trim(),
        },
      });
    }
    if (!mail) {
      return false;
    }
    const htmlBody = this.generateWelcomeEmailTemplate(dto.firstName);
    const { data, error } = await this.resend.emails.send({
      from: this.RESEND_FROM_EMAIL,
      to: dto.email,
      subject: WELCOME_EMAIL_SUBJECT,
      html: htmlBody,
    });

    if (error) {
      this.logger.error(error);
    }
    const newMail = this.mailRepository.create({
      to: dto.email,
      subject: WELCOME_EMAIL_SUBJECT,
    });
    await this.mailRepository.save(newMail);
    this.logger.log(data);
    return true;
  }

  private generateEmailVerificationCode() {
    try {
      const nanoid = customAlphabet(
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        6,
      );
      return nanoid();
    } catch (error: unknown) {
      this.logger.error(
        'Error generating email verification code with nanoid',
        error,
      );

      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  }
}
