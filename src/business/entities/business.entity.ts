import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * contact information ( email, phone-number, address, city, state, country)
 * business name
 * business category -> [food & drink, services, supplier, apparel, retail, other]
 * business description ( nullable )
 * business tagline (nullable)
 * business logo (nullable)
 */

@Entity()
export class Business {
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
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  tagLine: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  website: string;

  // Address fields
  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  // Business details
  @Column({ nullable: true })
  taxId: string;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column({ type: 'simple-json', nullable: true })
  businessHours: {
    [key: string]: { open: string; close: string };
  };

  @Column({ type: 'simple-array', default: [] })
  categories: string[];

  @Column()
  ownerId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
