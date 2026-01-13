import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../resource/entities/product.entity';
import { Service } from '../../resource/entities/service.entity';

export enum ItemType {
  PRODUCT = 'product',
  SERVICE = 'service',
}

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ItemType })
  itemType: ItemType;

  // SNAPSHOT DATA: Stored here so changes to the original Product/Service don't affect old orders
  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subTotal: number;

  // RELATIONS
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  // Nullable FK for Product
  @ManyToOne(() => Product, { nullable: true })
  product?: Product;

  // Nullable FK for Service
  @ManyToOne(() => Service, { nullable: true })
  service?: Service;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
