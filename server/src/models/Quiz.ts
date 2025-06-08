import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Topic } from "./Topic";
import { QuizQuestion } from "./QuizQuestion";
import { QuizLevel } from "../constants/quiz";
import { UserProgress } from "./UserProgress";

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Topic, (topic) => topic.quizzes)
  topic!: Topic;

  @Column({
    type: "enum",
    enum: QuizLevel,
  })
  level!: QuizLevel;

  @Column({ default: 0 })
  totalQuestions!: number;

  @OneToMany(() => QuizQuestion, (question) => question.quiz, { cascade: true })
  questions!: QuizQuestion[];

  @OneToMany(() => UserProgress, (progress) => progress.quiz, { cascade: true })
  userProgress!: UserProgress[];

  @Column({ default: 1 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
