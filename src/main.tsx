import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";
import logo from "./assets/logo.png";

const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
if (favicon) {
  favicon.href = logo;
  favicon.type = "image/png";
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);