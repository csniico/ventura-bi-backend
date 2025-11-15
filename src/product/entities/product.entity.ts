import { nanoid } from "nanoid";
import { BeforeInsert, Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Business } from "../../business/entities/business.entity";
import { OrderItem } from "../../order/entities/order-item.entity";

export enum ProductType {
    PHYSICAL = 'physical',
    DIGITAL = 'digital',
    SERVICE = 'service'
}

@Entity()
export class Product {
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

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    costPrice: number;

    @Column({ type: 'enum', enum: ProductType, default: ProductType.PHYSICAL })
    type: ProductType;

    @Column({ type: 'int', default: 0 })
    stockQuantity: number;

    @Column({ type: 'int', nullable: true })
    lowStockThreshold: number;

    @Column({ type: 'simple-array', default: [] })
    images: string[];

    @Column({ nullable: true })
    category: string;

    @Column({ nullable: true })
    brand: string;

    @Column({ type: 'simple-array', default: [] })
    tags: string[];

    @Column({ type: 'simple-json', nullable: true })
    attributes: Record<string, any>; // e.g., { "color": "red", "size": "L" }

    @Column({ default: false })
    isFeatured: boolean;

    @Column({ default: false })
    isDigital: boolean;

    // Business relationship
    @ManyToOne(() => Business, business => business.products, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column()
    businessId: string;

    // Relationships
    @OneToMany(() => OrderItem, orderItem => orderItem.product)
    orderItems: OrderItem[];

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date;
}
