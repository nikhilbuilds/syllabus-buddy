import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Quiz } from "./Quiz";

@Entity()
export class QuizQuestion {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Quiz)
  @JoinColumn({ name: "quiz_id" })
  quiz!: Quiz;

  @Column()
  question!: string;

  @Column("jsonb")
  options!: { A: string; B: string; C: string; D: string };

  @Column()
  answer!: "A" | "B" | "C" | "D";

  @Column({ nullable: true })
  explanation!: string;
}
