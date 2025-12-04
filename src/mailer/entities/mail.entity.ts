import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
}

@Entity()
export class Mail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 8 })
  shortId: string;

  @BeforeInsert()
  generateShortId() {
    if (!this.shortId) {
      this.shortId = nanoid(8);
    }
  }

  @Column()
  to: string;

  @Column({ nullable: true })
  from: string;

  @Column({ nullable: true })
  cc: string;

  @Column({ nullable: true })
  bcc: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  htmlBody: string;

  @Column({ type: 'enum', enum: MailStatus, default: MailStatus.PENDING })
  status: MailStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
