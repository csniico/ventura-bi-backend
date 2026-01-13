import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { Business } from 'src/business/entities/business.entity';
import { Customer } from 'src/customer/entities/customer.entity';

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 12 })
  orderNumber: string;

  @Column('uuid')
  businessId: string;

  @Column('uuid', { nullable: true })
  customerId: string;

  @Column('uuid', { nullable: true })
  invoiceId: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  // RELATIONS
  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ManyToOne(() => Invoice, (invoice) => invoice.orders, { nullable: true })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateOrderNumber() {
    if (!this.orderNumber) {
      this.orderNumber = `ORD-${nanoid(8).toUpperCase()}`;
    }
  }
}
