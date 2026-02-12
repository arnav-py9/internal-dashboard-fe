import React, { type JSX } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProfitFromBusiness from "./pages/ProfitFromBusiness";
import InvestmentsReimbursements from "./pages/InvestmentsReimbursements";
import Signup from "./pages/Signup";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup/>} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route
          path="/profit"
          element={
            <PrivateRoute>
              <ProfitFromBusiness />
            </PrivateRoute>
          }
        />
        <Route
          path="/investments"
          element={
            <PrivateRoute>
              <InvestmentsReimbursements />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;