import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Syllabus {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column("text")
  rawText!: string;

  @Column({ nullable: true })
  uploadedFileUrl!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ nullable: true })
  deletedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
