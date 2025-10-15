import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, ArrowRight } from "lucide-react";
import "../styles/Auth.css";

const Signup: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      signup(name);
      navigate("/dashboard");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>
        <div className="app-title">FinTrack</div>
        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-group">
            <User className="form-icon" size={20} />
            <input 
              type="text"
              placeholder="Enter your full name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
            />
          </div>
          
          <div className="form-group">
            <Mail className="form-icon" size={20} />
            <input 
              type="email"
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
          
          <button className="auth-btn" type="submit">
            Get Started <ArrowRight size={16} style={{ marginLeft: '8px' }} />
          </button>
        </form>
        
        <div className="auth-link-container">
          <p>
            Already have an account?{" "}
            <Link className="auth-link" to="/login">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;