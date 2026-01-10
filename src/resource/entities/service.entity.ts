import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 8, select: false })
  shortId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  primaryImage?: string;

  @Column('simple-array', { nullable: true })
  supportingImages?: string[];

  @Column('uuid')
  businessId: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('simple-json', { nullable: true })
  businessHours?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @BeforeInsert()
  generateShortId() {
    if (!this.shortId) {
      this.shortId = nanoid(8);
    }
  }
}
