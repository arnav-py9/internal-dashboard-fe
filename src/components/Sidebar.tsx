import React from "react";
import { DollarSign, TrendingUp } from "lucide-react";
import "../styles/Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <ul>
        <li>
          <DollarSign size={18} color="#007bff" /> Transactions
        </li>
        <li>
          <TrendingUp size={18} color="#007bff" /> Profit From Business
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
