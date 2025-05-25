import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User, userRoleEnum, beltLevelEnum } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

// Extended registration schema with additional belt fields
const registerSchema = insertUserSchema.extend({
  beltLevel: z.enum(beltLevelEnum.enumValues).optional(),
  stripes: z.number().min(0).max(4).optional(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        // Use direct fetch call with full error handling
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
          credentials: 'include'
        });

        // If we get HTML instead of JSON (which happens due to Vite middleware)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error("Login service unavailable. Please try again later.");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        }

        const data = await response.json();
        return data.user;
      } catch (err: any) {
        if (err.message.includes('JSON')) {
          throw new Error("Login service unavailable. Please try again later.");
        }
        throw err;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome back!",
        description: `You are now logged in as ${user.firstName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      // Remove confirmPassword as it's not needed in the API
      const { confirmPassword, beltLevel, stripes, ...registrationData } = userData;

      try {
        // Use direct fetch call with full error handling
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
          credentials: 'include'
        });

        // If we get HTML instead of JSON (which happens due to Vite middleware)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error("Registration service unavailable. Please try again later.");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Registration failed");
        }

        const data = await response.json();
        return data.user;
      } catch (err: any) {
        if (err.message.includes('JSON')) {
          throw new Error("Registration service unavailable. Please try again later.");
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Registration successful",
        description: "Your account is pending approval by an administrator. You'll receive access once approved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // Use direct fetch call with full error handling
        const response = await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include'
        });

        // If we get HTML instead of JSON (which happens due to Vite middleware)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error("Logout service unavailable. Please try again later.");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Logout failed");
        }
      } catch (err: any) {
        if (err.message.includes('JSON')) {
          throw new Error("Logout service unavailable. Please try again later.");
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}