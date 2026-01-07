import React, { useState, useEffect, useRef } from "react";
import { Menu, Rocket, LogOut, User, Settings, HelpCircle, X, Save, Mail, FileText, Shield, Database, Zap } from "lucide-react";
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
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Settings State
  const [settings, setSettings] = useState({
    currency: localStorage.getItem("currency") || "INR",
    dateFormat: localStorage.getItem("dateFormat") || "DD/MM/YYYY",
    notifications: localStorage.getItem("notifications") !== "false",
    autoSave: localStorage.getItem("autoSave") !== "false",
    twoFactor: localStorage.getItem("twoFactor") === "true",
  });

  // Profile State
  const [profile, setProfile] = useState({
    name: user || "Guest User",
    email: localStorage.getItem("userEmail") || "",
    phone: localStorage.getItem("userPhone") || "",
    bio: localStorage.getItem("userBio") || "",
  });

  const initials = user 
    ? user.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : "FT";

  const displayName = user || "Guest User";
  const userEmail = profile.email || `${user?.toLowerCase().replace(/\s+/g, '')}@fintrack.app`;

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

  const handleSaveSettings = () => {
    localStorage.setItem("currency", settings.currency);
    localStorage.setItem("dateFormat", settings.dateFormat);
    localStorage.setItem("notifications", settings.notifications.toString());
    localStorage.setItem("autoSave", settings.autoSave.toString());
    localStorage.setItem("twoFactor", settings.twoFactor.toString());
    setShowSettings(false);
    alert("Settings saved successfully!");
  };

  const handleSaveProfile = () => {
    localStorage.setItem("userEmail", profile.email);
    localStorage.setItem("userPhone", profile.phone);
    localStorage.setItem("userBio", profile.bio);
    setShowProfile(false);
    alert("Profile updated successfully!");
  };

  const menuItems = [
    { icon: User, label: "Profile", action: () => { setShowDropdown(false); setShowProfile(true); } },
    { icon: Settings, label: "Settings", action: () => { setShowDropdown(false); setShowSettings(true); } },
    { icon: HelpCircle, label: "Help & Support", action: () => { setShowDropdown(false); setShowHelp(true); } },
  ];

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
                  {menuItems.map((item, index) => (
                    <button 
                      key={index}
                      className="dropdown-item"
                      onClick={item.action}
                    >
                      <item.icon size={18} className="dropdown-item-icon" />
                      <span>{item.label}</span>
                    </button>
                  ))}
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay-pro" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <div>
                <h2>Settings</h2>
                <p>Customize your FinTrack experience</p>
              </div>
              <button className="modal-close-pro" onClick={() => setShowSettings(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-pro settings-body">
              <div className="settings-section">
                <div className="settings-section-header">
                  <Database size={20} />
                  <h3>General Preferences</h3>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Currency</label>
                    <p>Select your preferred currency</p>
                  </div>
                  <select 
                    value={settings.currency}
                    onChange={(e) => setSettings({...settings, currency: e.target.value})}
                    className="setting-select"
                  >
                    <option value="INR">₹ INR - Indian Rupee</option>
                    <option value="USD">$ USD - US Dollar</option>
                    <option value="EUR">€ EUR - Euro</option>
                    <option value="GBP">£ GBP - British Pound</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Date Format</label>
                    <p>Choose how dates are displayed</p>
                  </div>
                  <select 
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                    className="setting-select"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-header">
                  <Zap size={20} />
                  <h3>Features & Automation</h3>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Notifications</label>
                    <p>Receive alerts for important updates</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications}
                      onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Auto-Save</label>
                    <p>Automatically save changes</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.autoSave}
                      onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-header">
                  <Shield size={20} />
                  <h3>Security</h3>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Two-Factor Authentication</label>
                    <p>Add an extra layer of security</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.twoFactor}
                      onChange={(e) => setSettings({...settings, twoFactor: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowSettings(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveSettings}>
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="modal-overlay-pro" onClick={() => setShowProfile(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <div>
                <h2>Profile Settings</h2>
                <p>Manage your personal information</p>
              </div>
              <button className="modal-close-pro" onClick={() => setShowProfile(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-pro">
              <div className="profile-avatar-section">
                <div className="profile-avatar-large">{initials}</div>
                <div>
                  <h3>{displayName}</h3>
                  <p className="profile-role">Administrator Account</p>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label><User size={16} /> Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="input-pro"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label><Mail size={16} /> Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="input-pro"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>📱 Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="input-pro"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label><FileText size={16} /> Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    className="input-pro textarea-pro"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowProfile(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveProfile}>
                  <Save size={18} />
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelp && (
        <div className="modal-overlay-pro" onClick={() => setShowHelp(false)}>
          <div className="settings-modal help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <div>
                <h2>Help & Support</h2>
                <p>Get answers and assistance</p>
              </div>
              <button className="modal-close-pro" onClick={() => setShowHelp(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-pro help-body">
              <div className="help-section">
                <h3>📚 Getting Started</h3>
                <div className="help-item">
                  <h4>How to add transactions?</h4>
                  <p>Click the "Add Transaction" button on the dashboard, fill in the details (type, amount, date), and save.</p>
                </div>
                <div className="help-item">
                  <h4>Understanding your balance</h4>
                  <p>Your total balance = Credits + Business Profit - Debits. Track all income and expenses in one place.</p>
                </div>
                <div className="help-item">
                  <h4>Managing business profit</h4>
                  <p>Navigate to "Profit From Business" from the sidebar to track your business income separately.</p>
                </div>
              </div>

              <div className="help-section">
                <h3>🔧 Features</h3>
                <div className="help-item">
                  <h4>Filtering & Search</h4>
                  <p>Use the search box to find transactions by details. Filter by Credit/Debit type or specific months.</p>
                </div>
                <div className="help-item">
                  <h4>Edit & Delete</h4>
                  <p>Click the edit icon to modify a transaction or delete icon to remove it permanently.</p>
                </div>
                <div className="help-item">
                  <h4>Budget Planning</h4>
                  <p>Set your monthly expenditure to see estimated runway and spending percentage.</p>
                </div>
              </div>

              <div className="help-section">
                <h3>💬 Contact Support</h3>
                <div className="contact-options">
                  <div className="contact-card">
                    <Mail size={24} />
                    <h4>Email</h4>
                    <p>support@fintrack.app</p>
                  </div>
                  <div className="contact-card">
                    <FileText size={24} />
                    <h4>Documentation</h4>
                    <p>docs.fintrack.app</p>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-primary" onClick={() => setShowHelp(false)}>
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;