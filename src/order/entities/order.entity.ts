import { nanoid } from "nanoid";
import { BeforeInsert, Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Business } from "../../business/entities/business.entity";
import { Customer } from "../../customer/entities/customer.entity";
import { OrderItem } from "./order-item.entity";
import { Invoice } from "../../invoice/entities/invoice.entity";

export enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded'
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PARTIALLY_PAID = 'partially_paid',
    FAILED = 'failed',
    REFUNDED = 'refunded'
}

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 8 })
    shortId: string;

    @Column({ unique: true })
    orderNumber: string;

    @BeforeInsert()
    generateShortId() {
        if (!this.shortId) {
            this.shortId = nanoid(8);
        }
        if (!this.orderNumber) {
            this.orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;
        }
    }

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
    paymentStatus: PaymentStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tax: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    shipping: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ nullable: true })
    shippingAddress: string;

    @Column({ nullable: true })
    trackingNumber: string;

    // Business relationship
    @ManyToOne(() => Business, business => business.orders, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column()
    businessId: string;

    // Customer relationship
    @ManyToOne(() => Customer, customer => customer.orders, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @Column()
    customerId: string;

    // Order items
    @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
    items: OrderItem[];

    // Invoice relationship
    @OneToMany(() => Invoice, invoice => invoice.order)
    invoices: Invoice[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date;
}
