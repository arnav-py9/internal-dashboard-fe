import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogIn } from "lucide-react";
import "../styles/Auth.css";

const Login: React.FC = () => {
  const [name, setName] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      login(name);
      navigate("/dashboard");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome Back</h2>
        <div className="app-title">FinTrack</div>
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <User className="form-icon" size={20} />
            <input 
              type="text"
              placeholder="Enter your username" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
            />
          </div>
          
          <button className="auth-btn" type="submit">
            Sign In <LogIn size={16} style={{ marginLeft: '8px' }} />
          </button>
        </form>
        
        <div className="auth-link-container">
          <p>
            New to FinTrack?{" "}
            <Link className="auth-link" to="/signup">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;