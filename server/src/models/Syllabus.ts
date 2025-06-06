import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Topic } from "./Topic";
import { UploadType } from "../constants/uploadType";
import { QuizLevel } from "../constants/quiz";

export enum SyllabusStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

@Entity()
export class Syllabus {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column("text", { nullable: true })
  rawText!: string;

  @Column({ nullable: true })
  uploadedFileUrl!: string;

  @Column({ nullable: true })
  filePath!: string; // Local file path for processing

  @Column({
    type: "enum",
    enum: SyllabusStatus,
    default: SyllabusStatus.PENDING,
  })
  status!: SyllabusStatus;

  @Column({
    type: "enum",
    enum: QuizLevel,
    default: QuizLevel.BEGINNER,
  })
  stage!: QuizLevel;

  @Column({ nullable: true })
  errorMessage!: string; // Store error details if processing fails

  @Column({
    type: "enum",
    enum: UploadType,
    //default: UploadType.DESCRIPTION,
  })
  uploadType!: UploadType;

  @Column({ default: "en" })
  preferredLanguage!: string;

  @Column({ nullable: true })
  processingStartedAt!: Date;

  @Column({ nullable: true })
  processingCompletedAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ nullable: true })
  dailyStudyMinutes!: number;

  @OneToMany(() => Topic, (topic) => topic.syllabus)
  topics!: Topic[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
