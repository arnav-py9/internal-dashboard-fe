import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, ArrowRight } from "lucide-react";
import "../styles/Auth.css";

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      if (email.trim() && password.trim()) {
        login(email);
        navigate("/dashboard");
      }
    } else {
      if (name.trim() && email.trim() && password.trim()) {
        signup(name);
        navigate("/dashboard");
      }
    }
  };

  const switchMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="auth-container">
      <div className="gradient-bg"></div>
      <div className="floating-circle-1"></div>
      <div className="floating-circle-2"></div>

      <div className="auth-card" key={isLogin ? "login" : "signup"}>
        <div className="auth-header">
          <div className="app-logo">FinTrack</div>
          <h1 className="auth-title">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? "Sign in to manage your finances" 
              : "Start tracking your expenses today"}
          </p>
        </div>

        <div className="toggle-container">
          <button
            className={`toggle-btn ${isLogin ? "active" : ""}`}
            onClick={() => switchMode(true)}
          >
            Login
          </button>
          <button
            className={`toggle-btn ${!isLogin ? "active" : ""}`}
            onClick={() => switchMode(false)}
          >
            Signup
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group slide-down">
              <label className="form-label">Full Name</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          {isLogin && (
            <div className="forgot-password">
              <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>
          )}

          <button type="submit" className="submit-btn">
            <span>{isLogin ? "Sign In" : "Create Account"}</span>
            <ArrowRight size={18} className="btn-icon" />
          </button>
        </form>

        <div className="auth-footer">
          <p className="footer-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                switchMode(!isLogin);
              }}
              className="footer-link"
            >
              {isLogin ? "Sign up free" : "Sign in"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;