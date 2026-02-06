import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  user: string | null;
  userId: string | null;
  login: (email: string, userId: string) => void;
  signup: (email: string, userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(
    localStorage.getItem("userEmail") || null
  );
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem("user_id") || null
  );

  const login = (email: string, id: string) => {
    localStorage.setItem("userEmail", email);
    localStorage.setItem("user_id", id);
    setUser(email);
    setUserId(id);
  };

  const signup = (email: string, id: string) => {
    localStorage.setItem("userEmail", email);
    localStorage.setItem("user_id", id);
    setUser(email);
    setUserId(id);
  };

  const logout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("user_id");
    setUser(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ user, userId, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
