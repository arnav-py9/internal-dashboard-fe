import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

export default function Calculator() {
  const [value, setValue] = useState("");

  function handleClick(val: string) {
    if (val === "=") {
      try {
        setValue(eval(value).toString()); // quick demo
      } catch {
        setValue("Error");
      }
    } else if (val === "C") {
      setValue("");
    } else {
      setValue(value + val);
    }
  }

  const buttons = ["7","8","9","+","4","5","6","-","1","2","3","*","C","0","=","/"];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Navbar />
        <div style={{ padding: "2rem" }}>
          <h2>🧮 Calculator</h2>
          <input value={value} readOnly style={{ width: "100%", fontSize: "1.5rem", padding: "0.5rem", marginBottom: "1rem" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
            {buttons.map(b => (
              <button key={b} onClick={() => handleClick(b)} style={{ padding: "1rem", fontSize: "1.2rem" }}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
