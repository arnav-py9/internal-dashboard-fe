import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit">Login</button>
      </form>
      <p>New here? <Link to="/signup">Signup</Link></p>
    </div>
  );
};

export default Login;
