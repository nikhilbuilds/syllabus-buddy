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
  SYLLABUS_PROCESSOR = "syllabus-processor",
  SYLLABUS_UPLOAD = "syllabus-upload",
  QUIZ_GENERATOR = "quiz-generator",
  USER_ACTION = "user-action",
  SYSTEM = "system",
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
