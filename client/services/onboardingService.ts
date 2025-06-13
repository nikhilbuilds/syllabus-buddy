import axiosInstance from "../config/axios";
import { OnboardingData, OnboardingStatus } from "../types/onboarding";

export interface RegistrationData {
  email: string;
  name: string;
  password: string;
  pushToken: string;
}

export interface VerificationData {
  token: string;
}

class OnboardingService {
  async initiateRegistration(data: RegistrationData) {
    try {
      const response = await axiosInstance.post("/onboarding/register", data);
      return response.data;
    } catch (error: any) {
      console.log("Registration error:=============>", JSON.stringify(error));
      throw new Error(
        error.response?.data?.error || error.message || "Registration failed"
      );
    }
  }

  async verifyEmail(data: VerificationData) {
    try {
      const response = await axiosInstance.post(
        "/onboarding/verify-email",
        data,
        { withCredentials: false }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Email verification failed"
      );
    }
  }

  async completeOnboarding(data: OnboardingData) {
    try {
      const response = await axiosInstance.post("/onboarding/complete", data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Onboarding completion failed"
      );
    }
  }

  async getOnboardingStatus(): Promise<{
    success: boolean;
    data: OnboardingStatus;
  }> {
    try {
      const response = await axiosInstance.get("/onboarding/status");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to get onboarding status"
      );
    }
  }
}

export default new OnboardingService();
