import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
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

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  // RELATIONS
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

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
