import {
  createContext,
  useContext,
  PropsWithChildren,
  useState,
  useEffect,
} from "react";
import { router } from "expo-router";
import axiosInstance from "../config/axios";

interface AuthContextType {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  session: boolean;
  isLoading: boolean;
  user: User | null;
}

interface User {
  id: string;
  email: string;
  name: string;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  session: false,
  isLoading: true,
  user: null,
});

// This hook can be used to access the user info.
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be wrapped in a <SessionProvider />");
  }
  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Handle navigation when session changes
  useEffect(() => {
    if (!isLoading && session !== null) {
      // Only navigate when we have a definitive auth state
      if (session) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    }
  }, [session, isLoading]);

  const checkAuth = async () => {
    setIsLoading(true); // Ensure loading state is true when checking
    try {
      const response = await axiosInstance.get("/users");
      setSession(true);
      console.log("response", response.data.user);
      setUser(response.data.user);
    } catch (error) {
      console.log("Auth check failed:", error);
      setSession(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/users/login", {
        email,
        password,
      });

      if (response.status === 200) {
        setSession(true);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await axiosInstance.post("/users/logout");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setSession(false);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        session,
        isLoading,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
