import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import {
  EmailVerificationTemplate,
  VERIFICATION_EMAIL_SUBJECT,
} from 'src/mail/templates/email-verification-template';
import { SendMailDto } from 'src/mail/dto/send-mail.dto';
import { MailOptions } from 'nodemailer/lib/sendmail-transport';
import { MailService } from 'src/mail/mail.service';
import { MailStatus } from 'src/mail/entities/mail.entity';
import {
  WELCOME_EMAIL_SUBJECT,
  WelcomeEmailTemplate,
} from 'src/mail/templates/welcome-template';

interface MailResponseInfo {
  accepted: string[];
  rejected: string[];
  ehlo: string[];
  envelopeTime: number;
  messageTime: number;
  response: string;
  envelope: { from: string; to: string };
  messageId: string;
}

@Processor('mail')
@Injectable()
export class MailProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: Transporter;
  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  onModuleInit(): any {
    this.transporter = this.createTransport();
  }

  async process(job: Job): Promise<any> {
    try {
      this.logger.log(`Processing job ${job.id} of type ${job.name}`);
      switch (job.name) {
        case 'verification': {
          const { email, firstName, code, mailId } = job.data as {
            mailId: string; // shortId of the mail entity
            email?: string;
            firstName?: string;
            code?: string;
          };
          if (!email || !firstName || !code || !mailId) {
            throw new Error('Invalid queue data');
          }
          return await this.sendVerificationEmail({
            mailId,
            email,
            firstName,
            code,
          });
        }
        case 'welcome': {
          const { email, mailId, firstName } = job.data as {
            email: string;
            mailId: string;
            firstName: string;
          };
          if (!email || !mailId) {
            throw new Error('Invalid queue data');
          }
          return await this.sendWelcomeEmail({ email, mailId, firstName });
        }
        default:
          throw new Error(`Unknown job ${job.name}`);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`COMPLETED job ${job.id} of type ${job.name}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.log(`FAILED job ${job.id} of type ${job.name}`);
  }

  private async sendVerificationEmail({
    mailId,
    email,
    firstName,
    code,
  }: {
    mailId: string;
    email: string;
    firstName: string;
    code: string;
  }) {
    await this.mailService.updateMailStatus(mailId, MailStatus.SENT);
    const htmlBody = this.generateEmailVerificationTemplate(
      firstName,
      code,
      10,
    );
    return await this.sendMail(mailId, {
      recipients: [email],
      subject: VERIFICATION_EMAIL_SUBJECT,
      htmlBody: htmlBody,
      cc: [],
    });
  }

  private async sendWelcomeEmail({
    email,
    mailId,
    firstName,
  }: {
    email: string;
    mailId: string;
    firstName: string;
  }) {
    const htmlBody = this.generateWelcomeEmailTemplate(firstName);
    return await this.sendMail(mailId, {
      recipients: [email],
      subject: WELCOME_EMAIL_SUBJECT,
      htmlBody: htmlBody,
    });
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

  private generateWelcomeEmailTemplate(firstName: string) {
    return WelcomeEmailTemplate(firstName);
  }

  private async sendMail(mailId: string, sendMailDto: SendMailDto) {
    const { recipients, htmlBody, subject, cc } = sendMailDto;
    if (!recipients || recipients.length === 0) {
      throw new InternalServerErrorException('Recipient email is required.');
    }
    if (!htmlBody) {
      throw new InternalServerErrorException('Email body is required.');
    }
    if (!subject) {
      throw new InternalServerErrorException('Email subject is required.');
    }

    const mailOptions: MailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: recipients,
      subject: subject,
      html: htmlBody,
      replyTo: this.configService.get<string>('EMAIL_USER'),
    };

    if (cc) mailOptions.cc = cc;

    try {
      const info = (await this.transporter.sendMail(
        mailOptions,
      )) as MailResponseInfo;

      const totalRecipients = recipients.length + (cc?.length || 0);
      const acceptedCount = info.accepted?.length || 0;
      const rejectedCount = info.rejected?.length || 0;

      if (acceptedCount === totalRecipients && rejectedCount === 0) {
        await this.mailService.updateMailStatus(mailId, MailStatus.SENT);
        this.logger.log(
          `Email sent successfully to all recipients with messageId: ${info.messageId}`,
        );
      } else if (acceptedCount > 0 && rejectedCount > 0) {
        await this.mailService.updateMailStatus(
          mailId,
          MailStatus.PARTIALLY_SENT,
          { accepted: info.accepted, rejected: info.rejected },
        );
        this.logger.warn(
          `Email partially sent. Accepted: ${acceptedCount}, Rejected: ${rejectedCount}`,
        );
      } else if (rejectedCount === totalRecipients) {
        await this.mailService.updateMailStatus(mailId, MailStatus.FAILED, {
          reason: 'All recipients rejected!',
          rejected: info.rejected,
        });
      } else {
        await this.mailService.updateMailStatus(mailId, MailStatus.FAILED, {
          reason: 'Unknown error - no accepted or rejected recipients',
        });
        this.logger.error(`Email status unknown`);
      }

      this.logger.log(info);
      this.logger.log(`Email sent successfully.`);
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send email (mailId: ${mailId}): ${errorMessage}`,
      );
      throw new InternalServerErrorException('Failed to send email.');
    }
  }

  private createTransport() {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT');
    const user = this.configService.get<string>('EMAIL_USER');
    const password = this.configService.get<string>('EMAIL_PASSWORD');

    return nodemailer.createTransport({
      host: host,
      port: port,
      secure: true,
      auth: {
        user: user,
        pass: password,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }
}
