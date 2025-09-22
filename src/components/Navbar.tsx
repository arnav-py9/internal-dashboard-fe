import React from "react";
import "../styles/Dashboard.css";
import LogoutButton from "./LogoutButton.tsx";
const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <h1 className="logo">💰 Finance Manager</h1>
      <div className="profile">
        <img src="https://i.pravatar.cc/40" alt="User" />
        <span>Arnav</span>
        <LogoutButton />
      </div>
    </nav>
  );
};

export default Navbar;
