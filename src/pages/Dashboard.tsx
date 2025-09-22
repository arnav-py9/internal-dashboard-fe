import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/Dashboard.css";


const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-content">
        <Sidebar />
        <main className="main-content">
          <h2>Dashboard Overview</h2>

          <div className="cards">
            <div className="card">💵 Balance: $10,000</div>
            <div className="card">📈 Income: $4,000</div>
            <div className="card">📉 Expenses: $2,500</div>
          </div>

          <div className="table-container">
            <h3>Recent Transactions</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>21 Sept</td>
                  <td>Salary</td>
                  <td>+ $2000</td>
                </tr>
                <tr>
                  <td>20 Sept</td>
                  <td>Groceries</td>
                  <td>- $150</td>
                </tr>
                <tr>
                  <td>19 Sept</td>
                  <td>Stocks</td>
                  <td>+ $500</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
