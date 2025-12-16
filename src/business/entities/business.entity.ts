import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Appointment } from 'src/appointment/entities/appointment.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { Product } from 'src/product/entities/product.entity';
import { Order } from 'src/order/entities/order.entity';

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

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  logo: string;

  // Address fields
  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  zipCode: string;

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

  // One-to-One: Business has ONE owner
  @OneToOne(() => User, (user) => user.business, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'owner_id' }) // Foreign key lives in Business table
  owner: User;

  @Column()
  ownerId: string;

  // Relationships
  @OneToMany(() => Appointment, (appointment) => appointment.business)
  appointments: Appointment[];

  @OneToMany(() => Customer, (customer) => customer.business)
  customers: Customer[];

  @OneToMany(() => Invoice, (invoice) => invoice.business)
  invoices: Invoice[];

  @OneToMany(() => Product, (product) => product.business)
  products: Product[];

  @OneToMany(() => Order, (order) => order.business)
  orders: Order[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
