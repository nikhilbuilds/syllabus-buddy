export interface OnboardingData {
  age?: number;
  currentOccupation?: string;
  preferredLanguage: string;
  learningGoals?: string;
  targetExam?: string;
  additionalNotes?: string;
}

export interface OnboardingStatus {
  isEmailVerified: boolean;
  isOnboardingComplete: boolean;
  hasBasicInfo: boolean;
  targetExam?: string;
}
