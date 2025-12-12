import { Inject, Injectable, Logger } from '@nestjs/common';
import { MAILER_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Mail, MailStatus } from 'src/mail/entities/mail.entity';
import { VERIFICATION_EMAIL_SUBJECT } from 'src/mail/templates/email-verification-template';
import { VerifyCodeDto } from 'src/mail/dto/verify-code.dto';
import { WELCOME_EMAIL_SUBJECT } from 'src/mail/templates/welcome-template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(
    @Inject(MAILER_REPOSITORY)
    private mailRepository: Repository<Mail>,
    @InjectQueue('mail') private readonly mailQueue: Queue,
  ) {}

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
  }: {
    email: string;
    firstName: string;
  }) {
    const verificationCode = this.generateEmailVerificationCode();
    const mail = this.mailRepository.create({
      to: email,
      subject: VERIFICATION_EMAIL_SUBJECT,
      verificationCode: verificationCode,
    });
    await this.mailRepository.save(mail);
    await this.mailQueue.add('verification', {
      mailId: mail.shortId, //shortId of the mail entity
      email,
      firstName,
      code: verificationCode,
    });
    return {
      message: 'Verification code sent',
      id: mail.shortId,
    };
  }

  async validateVerificationCode(dto: VerifyCodeDto & { firstName: string }) {
    try {
      this.logger.log(dto);
      const mail = await this.mailRepository.findOne({
        where: { shortId: dto.id, to: dto.email, verificationCode: dto.code },
      });
      if (!mail) {
        this.logger.log(mail);
        return false;
      }
      const newMail = this.mailRepository.create({
        to: dto.email,
        subject: WELCOME_EMAIL_SUBJECT,
      });
      const savedMail = await this.mailRepository.save(newMail);
      await this.mailQueue.add('welcome', {
        mailId: savedMail.shortId,
        email: dto.email,
        firstName: dto.firstName,
      });
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.log(errorMessage);
      return false;
    }
  }

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
}
