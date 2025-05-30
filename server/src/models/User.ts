import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Syllabus } from "./Syllabus";
import { UserProgress } from "./UserProgress";
import moment from "moment";

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

  @Column({ nullable: true })
  age?: number;

  @Column({ nullable: true })
  currentOccupation?: string;

  @Column({ default: "en" })
  preferredLanguage!: string;

  @Column({ type: "text", nullable: true })
  learningGoals?: string;

  @Column({ nullable: true })
  targetExam?: string;

  @Column({ type: "text", nullable: true })
  additionalNotes?: string;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  emailVerificationExpires?: Date;

  @Column({ default: false })
  isOnboardingComplete!: boolean;

  @Column({ default: 10 })
  dailyMinutes!: number;

  @Column({ default: 0 })
  currentStreak!: number;

  @Column({ nullable: true })
  lastStreakUpdate!: Date;

  @Column({ nullable: true })
  pushToken?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Syllabus, (syllabus) => syllabus.user)
  syllabi!: Syllabus[];

  @OneToMany(() => UserProgress, (progress) => progress.user)
  progress!: UserProgress[];

  /**
   * Update streak based on activity today
   * This is the fast method for real-time updates
   */
  updateStreakForToday(): void {
    const todayStr = moment().format("YYYY-MM-DD");
    const lastUpdateStr = this.lastStreakUpdate
      ? moment(this.lastStreakUpdate).format("YYYY-MM-DD")
      : null;

    if (lastUpdateStr === todayStr) {
      // Already updated today → no change
      return;
    } else if (
      lastUpdateStr === moment().subtract(1, "day").format("YYYY-MM-DD")
    ) {
      // Yesterday was the last update → increment streak
      this.currentStreak += 1;
    } else {
      // Gap in streak → reset to 1
      this.currentStreak = 1;
    }

    this.lastStreakUpdate = new Date();
  }

  /**
   * Check if streak needs to be broken (no activity today)
   */
  shouldBreakStreak(): boolean {
    if (!this.lastStreakUpdate) return false;

    const todayStr = moment().format("YYYY-MM-DD");
    const lastUpdateStr = moment(this.lastStreakUpdate).format("YYYY-MM-DD");
    const yesterdayStr = moment().subtract(1, "day").format("YYYY-MM-DD");

    // If last update was before yesterday, streak should be broken
    return lastUpdateStr !== todayStr && lastUpdateStr !== yesterdayStr;
  }

  /**
   * Break the streak (called by cron job if no activity)
   */
  breakStreak(): void {
    this.currentStreak = 0;
    // Don't update lastStreakUpdate when breaking streak
  }
}
