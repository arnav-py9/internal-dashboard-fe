import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  user: string | null;
  login: (email: string) => void;
  signup: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(
    localStorage.getItem("userEmail") || null
  );

  const login = (email: string) => {
    localStorage.setItem("userEmail", email);
    setUser(email);
  };

  const signup = (email: string) => {
    localStorage.setItem("userEmail", email);
    setUser(email);
  };

  const logout = () => {
    localStorage.removeItem("userEmail");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
