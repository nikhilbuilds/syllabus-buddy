import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Topic } from "./Topic";
import { QuizLevel } from "../constants/quiz";

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Topic)
  @JoinColumn({ name: "topic_id" })
  topic!: Topic;

  @Column({ default: true })
  generatedByAi!: boolean;

  @Column({
    type: "enum",
    enum: QuizLevel,
    nullable: false,
  })
  level!: QuizLevel;

  @CreateDateColumn()
  createdAt!: Date;
}
