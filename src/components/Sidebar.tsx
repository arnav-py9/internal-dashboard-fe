import React from "react";
import { Link } from "react-router-dom";
import "../styles/Dashboard.css";

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <h2>Menu</h2>
      <ul>
        <li><Link to="/dashboard">📊 Dashboard</Link></li>
        <li><Link to="/calculator">🧮 Calculator</Link></li>
      </ul>
    </aside>
  );
};

export default Sidebar;
