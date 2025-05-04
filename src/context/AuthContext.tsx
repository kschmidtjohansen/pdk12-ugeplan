
import React, { createContext, useContext, useState, useEffect } from "react";

// User roles
export type UserRole = "administrator" | "skadeleder" | "servicemedarbejder";

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for development
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@polygon.com",
    role: "administrator",
  },
  {
    id: "2",
    name: "Skadeleder User",
    email: "skadeleder@polygon.com",
    role: "skadeleder",
  },
  {
    id: "3",
    name: "Service User",
    email: "service@polygon.com",
    role: "servicemedarbejder",
  },
];

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("polygonUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Mock login function
  const login = async (email: string, password: string) => {
    // Simulate API request
    setIsLoading(true);
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (foundUser && password === "password") {
          setUser(foundUser);
          localStorage.setItem("polygonUser", JSON.stringify(foundUser));
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error("Invalid email or password"));
        }
      }, 1000);
    });
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("polygonUser");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Hook to check permissions based on role
export const usePermissions = () => {
  const { user } = useAuth();
  
  return {
    // General permissions
    canCreate: user?.role === "administrator" || user?.role === "skadeleder",
    canEdit: user?.role === "administrator" || user?.role === "skadeleder",
    canDelete: user?.role === "administrator",
    canViewFuelCardCode: user?.role === "administrator",
    isAdmin: user?.role === "administrator",
    isSkadeleder: user?.role === "skadeleder",
    isServicemedarbejder: user?.role === "servicemedarbejder",
    
    // Vacation specific permissions
    canApproveVacation: user?.role === "administrator",
    canViewAllVacations: user?.role === "administrator" || user?.role === "skadeleder",
    
    // Helper function to check if user has a specific role or higher
    hasRole: (minimumRole: UserRole): boolean => {
      if (!user) return false;
      
      if (minimumRole === "servicemedarbejder") return true; // Everyone is at least servicemedarbejder
      if (minimumRole === "skadeleder") return user.role === "skadeleder" || user.role === "administrator";
      if (minimumRole === "administrator") return user.role === "administrator";
      
      return false;
    }
  };
};
