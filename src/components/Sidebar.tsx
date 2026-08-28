import React from "react";
import { DollarSign, TrendingUp, HandCoins, BarChart3, LayoutDashboard, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  currentPage: "overview" | "transactions" | "profit" | "client-revenue" | "investments" | "analytics";
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPage }) => {
  const navigate = useNavigate();

  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <ul className="sidebar-menu">
        <li
          className={`sidebar-item ${currentPage === "overview" ? "active" : ""}`}
          onClick={() => navigate("/overview")}
        >
          <LayoutDashboard size={20} />
          <span className="sidebar-text">Overview</span>
        </li>
        <li
          className={`sidebar-item ${currentPage === "transactions" ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}
        >
          <DollarSign size={20} />
          <span className="sidebar-text">Transactions</span>
        </li>
        <li
          className={`sidebar-item ${currentPage === "profit" ? "active" : ""}`}
          onClick={() => navigate("/profit")}
        >
          <TrendingUp size={20} />
          <span className="sidebar-text">Profit From Business</span>
        </li>
        <li
          className={`sidebar-item ${currentPage === "client-revenue" ? "active" : ""}`}
          onClick={() => navigate("/client-revenue")}
        >
          <Users size={20} />
          <span className="sidebar-text">Client Revenue Tracker</span>
        </li>
        <li
          className={`sidebar-item ${currentPage === "investments" ? "active" : ""}`}
          onClick={() => navigate("/investments")}
        >
          <HandCoins size={20} />
          <span className="sidebar-text">Investments & Salaries</span>
        </li>
        <li
          className={`sidebar-item ${currentPage === "analytics" ? "active" : ""}`}
          onClick={() => navigate("/analytics")}
        >
          <BarChart3 size={20} />
          <span className="sidebar-text">Analytics</span>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;