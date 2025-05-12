import { createContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { User, LoginCredentials } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => {
    throw new Error("Not implemented");
  },
  logout: async () => {
    throw new Error("Not implemented");
  },
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  // Fetch the current user if they're logged in
  const { data, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`${response.status}: ${await response.text()}`);
        }
        
        return await response.json();
      } catch (err) {
        console.error("Error fetching user:", err);
        return null;
      }
    }
  });
  
  // Update user state when data changes
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log("Login mutation called with:", credentials);
      try {
        const res = await apiRequest("POST", "/api/auth/login", credentials);
        const userData = await res.json();
        console.log("Login response:", userData);
        return userData as User;
      } catch (error) {
        console.error("Login mutation error:", error);
        throw error;
      }
    },
    onSuccess: (data: User) => {
      console.log("Login success, setting user:", data);
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      console.error("Login mutation error handler:", error);
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });

  const login = async (credentials: LoginCredentials): Promise<User> => {
    console.log("Auth context login called with:", credentials);
    try {
      const result = await loginMutation.mutateAsync(credentials);
      console.log("Login mutation result:", result);
      return result;
    } catch (error) {
      console.error("Login error in auth context:", error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: error as Error | null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}