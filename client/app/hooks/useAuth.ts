import { useState, useEffect } from "react";
import { User } from "../types/user";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data from your auth context or API
    const fetchUser = async () => {
      try {
        // Replace this with your actual user fetching logic
        const response = await fetch("/api/user");
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return {
    user,
    loading,
    setUser,
  };
};
