import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Syllabus } from "./Syllabus";
import { Quiz } from "./Quiz";

@Entity("topics")
export class Topic {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column("text")
  summary!: string; // Make sure this field exists

  @Column({ nullable: true })
  estimatedTimeMinutes?: number;

  @Column("simple-array", { nullable: true })
  keywords?: string[];

  @Column({ nullable: true })
  dayIndex!: number;

  @Column({ nullable: true })
  assignedDate!: Date;

  @ManyToOne(() => Syllabus, (syllabus) => syllabus.topics)
  syllabus!: Syllabus;

  @OneToMany(() => Quiz, (quiz) => quiz.topic)
  quizzes!: Quiz[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
