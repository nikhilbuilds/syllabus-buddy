import axiosInstance from "../config/axios";

class UserService {
  async getProfile() {
    try {
      const response = await axiosInstance.get("/users/profile");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || "Failed to get profile"
      );
    }
  }

  async updateProfile(data: any) {
    try {
      const response = await axiosInstance.put("/users/profile", data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to update profile"
      );
    }
  }

  async getDashboardStats() {
    try {
      const response = await axiosInstance.get("/dashboard/stats");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to get dashboard stats"
      );
    }
  }
}

export default new UserService();
