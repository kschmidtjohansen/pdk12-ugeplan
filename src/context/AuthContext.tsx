
import React, { createContext, useContext } from "react";
import { AuthContextType, AuthProviderProps, User, UserRole } from "../types/auth";
import { useAuthProvider } from "../hooks/useAuthProvider";

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();
  
  return (
    <AuthContext.Provider value={auth}>
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

// Re-export permissions hook
export { usePermissions } from "../hooks/usePermissions";
export type { User, UserRole } from "../types/auth";
