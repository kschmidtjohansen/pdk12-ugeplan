
import React, { createContext, useContext, useState, useEffect } from "react";

// User roles
export type UserRole = "administrator" | "skadeleder" | "servicemedarbejder";

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
  password?: string; // Used only for admin management, not stored client-side in production
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (userId: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for development
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Admin",
    email: "admin@polygongroup.com",
    role: "administrator",
    phone: "+45 12 34 56 78",
    jobTitle: "System Administrator",
    password: "password" // For development only
  },
  {
    id: "2",
    name: "Skadeleder",
    email: "skadeleder@polygongroup.com",
    role: "skadeleder",
    phone: "+45 23 45 67 89",
    jobTitle: "Team Leader",
    password: "password" // For development only
  },
  {
    id: "3",
    name: "Servicemedarbejder",
    email: "service@polygongroup.com",
    role: "servicemedarbejder",
    phone: "+45 34 56 78 90",
    jobTitle: "Field Technician",
    password: "password" // For development only
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
        
        if (foundUser && password === foundUser.password) {
          // Don't include password in the user object stored in state/localStorage
          const { password: _, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem("polygonUser", JSON.stringify(userWithoutPassword));
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

  // Password reset request function
  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (foundUser) {
          // In a real app, this would send an email
          console.log(`Password reset requested for ${email}`);
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error("User not found"));
        }
      }, 1000);
    });
  };

  // Admin reset password function
  const resetPassword = async (userId: string, newPassword: string) => {
    setIsLoading(true);
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
          // Update password in mock users array
          MOCK_USERS[userIndex] = {
            ...MOCK_USERS[userIndex],
            password: newPassword
          };
          console.log(`Password has been reset for user ${userId}`);
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error("User not found"));
        }
      }, 500);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        requestPasswordReset,
        resetPassword,
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
    
    // Task visibility
    canSeeUnpublishedTasks: user?.role === "administrator" || user?.role === "skadeleder",
    canPublishTasks: user?.role === "administrator" || user?.role === "skadeleder",
    
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
