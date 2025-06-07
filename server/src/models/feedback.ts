import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export type FeedbackCategory = "bug" | "feature" | "improvement" | "other";
export type FeedbackStatus = "pending" | "in_progress" | "resolved";

@Entity("feedbacks")
export class Feedback {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({
    type: "enum",
    enum: ["bug", "feature", "improvement", "other"],
  })
  category: FeedbackCategory;

  @Column("text")
  content: string;

  @Column({
    type: "enum",
    enum: ["pending", "in_progress", "resolved"],
    default: "pending",
  })
  status: FeedbackStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
