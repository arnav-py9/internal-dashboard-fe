import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import "../styles/Auth.css";

const Signup: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    const res = await fetch("http://127.0.0.1:8000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.detail || "Signup failed");
      return;
    }

    signup(email);
    navigate("/dashboard");
  };

  return (
    <div className="auth-container">
      <div className="gradient-bg"></div>

      {/* floating lights for depth */}
      <div className="floating-circle-1"></div>
      <div className="floating-circle-2"></div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="app-logo">FinTrack</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Start your financial journey</p>
        </div>

        {error && <p className="error-text">{error}</p>}

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
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

          <button type="submit" className="submit-btn">
            <span>Get Started</span>
            <ArrowRight size={18} className="btn-icon" />
          </button>
        </form>

        <div className="auth-footer">
          <p className="footer-text">
            Already have an account?{" "}
            <Link to="/login" className="footer-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
