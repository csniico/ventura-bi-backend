import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity()
export class Permission {
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

  @Column({ unique: true })
  name: string; // e.g., "user.create", "post.delete", "report.view"

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  resource: string; // e.g., "user", "post", "report"

  @Column({ nullable: true })
  action: string; // e.g., "create", "read", "update", "delete"

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @ManyToMany(() => User, (user) => user.directPermissions)
  users: User[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
