import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Syllabus } from "./Syllabus";

@Entity()
export class Topic {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Syllabus)
  @JoinColumn({ name: "syllabus_id" })
  syllabus!: Syllabus;

  @Column()
  title!: string;

  @Column({ default: 1 })
  dayIndex!: number;

  @Column()
  estimatedTimeMinutes!: number;

  @Column({ type: "date", nullable: true })
  assignedDate!: Date;
}
