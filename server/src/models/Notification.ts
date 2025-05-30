import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

export enum NotificationType {
  STREAK_ALERT = "STREAK_ALERT",
  WELCOME = "WELCOME",
  NEW_FEATURE = "NEW_FEATURE",
  REFERRAL = "REFERRAL",
}

export enum NotificationChannel {
  PUSH = "PUSH",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  DELIVERED = "DELIVERED",
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Column({
    type: "enum",
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column({
    type: "enum",
    enum: NotificationChannel,
  })
  channel!: NotificationChannel;

  @Column({
    type: "enum",
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Column()
  title!: string;

  @Column("text")
  message!: string;

  @Column("json", { nullable: true })
  metadata!: any;

  @Column({ nullable: true })
  scheduledAt!: Date;

  @Column({ nullable: true })
  sentAt!: Date;

  @Column("text", { nullable: true })
  errorMessage!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
