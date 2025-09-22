import React from "react";
import "./Auth.css";

type Props = { children: React.ReactNode };

const AuthLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="brand">FinTrack</h1>
        <p className="tagline">Smart Finance Dashboard</p>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
