import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class CurrentAffair {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  headline!: string;

  @Column("text")
  summary!: string;

  @Column("simple-array")
  keywords!: string[];

  @Column("simple-array")
  relatedTopics!: string[];

  @Column({ nullable: true })
  publishedDate?: Date;

  @Column({ nullable: true })
  filePath?: string;

  @Column({ default: false })
  isImportant!: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
