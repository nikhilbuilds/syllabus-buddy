import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Syllabus } from "./Syllabus";

export enum LogLevel {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  DEBUG = "debug",
}

export enum LogSource {
  SYLLABUS_QUEUE = "syllabus-queue",
  NOTIFICATION_QUEUE = "notification-queue",
  SYLLABUS_PROCESSOR = "syllabus-processor",
  TOPIC_PARSER = "topic-parser",
  QUIZ_GENERATOR = "quiz-generator",
}

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "enum",
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level!: LogLevel;

  @Column({
    type: "enum",
    enum: LogSource,
  })
  source!: LogSource;

  @Column("text")
  message!: string;

  @Column("jsonb", { nullable: true })
  metadata?: any;

  @ManyToOne(() => Syllabus, { nullable: true })
  @JoinColumn({ name: "syllabus_id" })
  syllabus?: Syllabus;

  @CreateDateColumn()
  createdAt!: Date;
}
