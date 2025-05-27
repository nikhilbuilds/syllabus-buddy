import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Topic } from "./Topic";
import { Quiz } from "./Quiz";

@Entity()
export class UserProgress {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Topic)
  @JoinColumn({ name: "topic_id" })
  topic!: Topic;

  @ManyToOne(() => Quiz)
  @JoinColumn({ name: "quiz_id" })
  quiz!: Quiz;

  @Column()
  score!: number;

  @Column()
  totalQuestions!: number;

  @Column()
  completedOn!: Date;
}
