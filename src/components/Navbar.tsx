import React, { useState } from "react";
import { Menu, Rocket } from "lucide-react";
import "../styles/Navbar.css";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showDialog, setShowDialog] = useState(false);

  const initials = user ? user.substring(0, 2).toUpperCase() : "FT";

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <Menu size={24} color="#007bff" />
        </button>
        <Rocket size={32} color="#007bff" className="logo" />
      </div>

      <h2 className="nav-center">FinTrack</h2>

      <div className="nav-right">
        <div className="profile-circle" onClick={() => setShowDialog(!showDialog)}>
          {initials}
        </div>

        {showDialog && (
          <div className="logout-dialog">
            <button onClick={logout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;