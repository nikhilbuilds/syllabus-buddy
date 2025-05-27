import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export type SocialProvider = "google" | "github" | "apple" | "linkedin";

@Entity()
export class UserAuth {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  provider!: SocialProvider;

  @Column()
  providerUserId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
