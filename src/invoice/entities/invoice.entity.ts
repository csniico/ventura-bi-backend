import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { Business } from 'src/business/entities/business.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { Order } from 'src/order/entities/order.entity';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CHEQUE = 'CHEQUE',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @Column({ type: 'uuid' })
  customerId: string;

  // Relationships
  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @OneToMany(() => Order, (order) => order.invoice)
  orders: Order[];

  // Financial Details - Ghana VAT Structure
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // VAT - 15%
  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.15 })
  vatRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  vatAmount: number;

  // NHIL - 2.5%
  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.025 })
  nhilRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  nhilAmount: number;

  // GETFund Levy - 2.5%
  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.025 })
  getfundRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  getfundAmount: number;

  // Total tax (VAT + NHIL + GETFund = 20%)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalTax: number;

  // Final amount
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  // Payment tracking
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'timestamp', nullable: true })
  paymentDate: Date;

  // Dates
  @Column({ type: 'timestamp', nullable: true })
  issueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateInvoiceNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.invoiceNumber = `INV-${timestamp}${random}`;
  }
}
