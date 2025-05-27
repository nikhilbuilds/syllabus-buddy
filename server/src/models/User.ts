import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true, select: false })
  passwordHash!: string;

  @Column()
  name!: string;

  @Column({ default: 10 })
  dailyMinutes!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
