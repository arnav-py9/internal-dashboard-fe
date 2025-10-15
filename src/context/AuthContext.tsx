import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  user: string | null;
  login: (name: string) => void;
  signup: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(localStorage.getItem("username") || null);

  const login = (name: string) => {
    localStorage.setItem("username", name);
    setUser(name);
  };

  const signup = (name: string) => {
    localStorage.setItem("username", name);
    setUser(name);
  };

  const logout = () => {
    localStorage.removeItem("username");
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
