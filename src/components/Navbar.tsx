import React, { useState, useEffect, useRef } from "react";
import { Menu, Rocket, LogOut, User, Settings, HelpCircle, Bell, Moon, Sun } from "lucide-react";
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user 
    ? user.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : "FT";

  const displayName = user || "Guest User";
  const userEmail = user ? `${user.toLowerCase().replace(/\s+/g, '')}@fintrack.app` : "guest@fintrack.app";

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

  const menuItems = [
    { icon: User, label: "Profile", action: () => console.log("Profile") },
    { icon: Settings, label: "Settings", action: () => console.log("Settings") },
    { icon: HelpCircle, label: "Help & Support", action: () => console.log("Help") },
  ];

  return (
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
        {/* Theme Toggle */}
        <button 
          className="icon-button theme-toggle"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "Light mode" : "Dark mode"}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="icon-button notification-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-badge">3</span>
        </button>

        {/* User Avatar & Dropdown */}
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

          {/* Professional Dropdown Menu */}
          {showDropdown && (
            <div className="dropdown-menu-pro">
              {/* User Info Section */}
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  <div className="dropdown-avatar-circle">
                    {initials}
                  </div>
                  <div className="online-indicator"></div>
                </div>
                <div className="dropdown-user-info">
                  <h4 className="dropdown-user-name">{displayName}</h4>
                  <p className="dropdown-user-email">{userEmail}</p>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              {/* Menu Items */}
              <div className="dropdown-section">
                {menuItems.map((item, index) => (
                  <button 
                    key={index}
                    className="dropdown-item"
                    onClick={() => {
                      item.action();
                      setShowDropdown(false);
                    }}
                  >
                    <item.icon size={18} className="dropdown-item-icon" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="dropdown-divider"></div>

              {/* Logout Button */}
              <div className="dropdown-section">
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <LogOut size={18} className="dropdown-item-icon" />
                  <span>Sign Out</span>
                  <kbd className="kbd-shortcut">⌘Q</kbd>
                </button>
              </div>

              {/* Footer */}
              <div className="dropdown-footer">
                <span>FinTrack v2.0.1</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;