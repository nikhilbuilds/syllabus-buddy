import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Topic } from "./Topic";

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Topic)
  @JoinColumn({ name: "topic_id" })
  topic!: Topic;

  @Column({ default: true })
  generatedByAi!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
