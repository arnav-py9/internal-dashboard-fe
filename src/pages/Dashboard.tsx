import React, { useState } from "react"; // Removed useEffect
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/Dashboard.css";

interface Transaction {
  details: string;
  type: "Credit" | "Debit";
  date: string;
  amount: number;
}

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [monthlyExp, setMonthlyExp] = useState(10000);
  // NOTE: setBalance is currently unused, which triggers a warning.
  // If you don't plan to change the balance, you could remove setBalance.
  // For now, it's kept to maintain the state structure.
  const [balance] = useState(100000); 
  const [filterType, setFilterType] = useState("All");

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const totalSpent = transactions
    .filter((t) => t.type === "Debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const filtered = filterType === "All"
    ? transactions
    : transactions.filter((t) => t.type === filterType);

  const months = [
    "January","February","March","April","May","June","July",
    "August","September","October","November","December"
  ];
  const expiryMonth = new Date();
  expiryMonth.setMonth(expiryMonth.getMonth() + Math.floor((balance - totalSpent) / monthlyExp));

  const handleAdd = () => {
    const details = prompt("Enter transaction details:") || "";
    const type = (prompt("Credit or Debit?") || "Debit") as "Credit" | "Debit";
    const amount = Number(prompt("Enter amount:"));
    const date = new Date().toISOString().split("T")[0];
    if (!details || isNaN(amount)) return;
    setTransactions([...transactions, { details, type, amount, date }]);
  };

  return (
    <div className="dashboard">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="dashboard-body">
        <Sidebar isOpen={isSidebarOpen} />
        <main>
          <div className="header">
            <h2>Transactions</h2>
            <button onClick={handleAdd}>Add Transaction</button>
          </div>

          <div className="cards">
            <div className="card">
              <h3>Amount Spent</h3>
              <p>₹{totalSpent}</p>
            </div>
            <div className="card">
              <h3>Balance Left</h3>
              <p>₹{balance - totalSpent}</p>
            </div>
            <div className="card">
              <h3>Monthly Expenditure</h3>
              <input type="number" value={monthlyExp} onChange={(e) => setMonthlyExp(Number(e.target.value))}/>
            </div>
            <div className="card">
              <h3>Estimated Expiry</h3>
              <p>{months[expiryMonth.getMonth()]} {expiryMonth.getFullYear()}</p>
            </div>
          </div>

          <div className="filters">
            <select onChange={(e) => setFilterType(e.target.value)}>
              <option>All</option>
              <option>Credit</option>
              <option>Debit</option>
            </select>
          </div>

          <table>
            <thead>
              <tr><th>Details</th><th>Type</th><th>Date</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i}>
                  <td>{t.details}</td>
                  <td>{t.type}</td>
                  <td>{t.date}</td>
                  <td>₹{t.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;