import React from "react";
import { DollarSign, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  currentPage: "transactions" | "profit";
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPage }) => {
  const navigate = useNavigate();

  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <ul className="sidebar-menu">
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
      </ul>
    </aside>
  );
};

export default Sidebar;