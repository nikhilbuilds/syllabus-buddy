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
  resendVerification: () => Promise<void>;
  session: boolean;
  isLoading: boolean;
  user: User | null;
  checkAuth: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  isOnboardingComplete: boolean;
  needsNewVerificationEmail?: boolean;
  preferredLanguage: string;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  resendVerification: async () => {},
  session: false,
  isLoading: true,
  user: null,
  checkAuth: async () => {},
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
    if (!isLoading) {
      if (session && user) {
        if (!user.isEmailVerified) {
          if (user.needsNewVerificationEmail) {
            resendVerification().catch(console.error);
          }
          router.replace("/(auth)/verify-email");
        } else if (!user.isOnboardingComplete) {
          router.replace("/(onboarding)/personal-info");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        router.replace("/login");
      }
    }
  }, [session, isLoading, user]);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      console.log("Checking auth called ----------------->");
      const response = await axiosInstance.get("/users/profile");
      console.log("response profile==========>", response.data);
      setSession(true);
      setUser(response.data.user);
      console.log("Auth check response:", response.data.user);
    } catch (error) {
      console.log("Auth check failed:", error);
      setSession(false);
      setUser(null);
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
        setUser(response.data.user);
        // Navigation will be handled by useEffect above
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
      setUser(null);
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      const response = await axiosInstance.post("/users/resend-verification");
      console.log("response==================>", response.data);
      if (user) {
        setUser({ ...user, needsNewVerificationEmail: false });
      }
    } catch (error) {
      console.error(
        "Resend verification error:==========>",
        JSON.stringify(error)
      );
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        resendVerification,
        session,
        isLoading,
        user,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
