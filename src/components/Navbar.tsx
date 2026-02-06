import React, { useState, useEffect, useRef } from "react";
import { Menu, Rocket, LogOut } from "lucide-react";
import "../styles/Navbar.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);



  const initials = user
    ? user.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : "FT";

  const displayName = user || "Guest User";
  const userEmail = `${user?.toLowerCase().replace(/\s+/g, '')}@fintrack.app`;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    navigate("/login");
  };



  return (
    <>
      <nav className="navbar-pro">
        <div className="navbar-left">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <Menu size={22} />
          </button>

          <div className="brand-container">
            <div className="brand-icon-wrapper">
              <Rocket size={24} className="brand-icon" />
            </div>
            <div className="brand-info">
              <span className="brand-name">FinTrack</span>
              <span className="brand-tagline">Pro</span>
            </div>
          </div>
        </div>

        <div className="navbar-right">


          <div className="user-menu" ref={dropdownRef}>
            <button
              className={`avatar-button ${showDropdown ? 'active' : ''}`}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="avatar-circle">
                <span className="avatar-initials">{initials}</span>
                <div className="avatar-status"></div>
              </div>
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-role">Administrator</span>
              </div>
              <svg
                className={`dropdown-arrow ${showDropdown ? 'rotated' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2.5 4.5L6 8L9.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showDropdown && (
              <div className="dropdown-menu-pro">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    <div className="dropdown-avatar-circle">{initials}</div>
                    <div className="online-indicator"></div>
                  </div>
                  <div className="dropdown-user-info">
                    <h4 className="dropdown-user-name">{displayName}</h4>
                    <p className="dropdown-user-email">{userEmail}</p>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-section">
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={18} className="dropdown-item-icon" />
                    <span>Sign Out</span>
                    <kbd className="kbd-shortcut">⌘Q</kbd>
                  </button>
                </div>

                <div className="dropdown-footer">
                  <span>FinTrack v2.0.1</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>


    </>
  );
};

export default Navbar;