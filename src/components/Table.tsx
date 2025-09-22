import { useState } from "react";
import "./Table.css";

interface Row {
  id: number;
  description: string;
  amount: number;
}

export default function Table() {
  const [rows, setRows] = useState<Row[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  function addRow() {
    if (!desc || !amount) return;
    setRows([...rows, { id: Date.now(), description: desc, amount: Number(amount) }]);
    setDesc("");
    setAmount("");
  }

  function deleteRow(id: number) {
    setRows(rows.filter(r => r.id !== id));
  }

  return (
    <div className="table-container">
      <h3>📊 Finance Records</h3>
      <div className="table-inputs">
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount" />
        <button onClick={addRow}>Add</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount ($)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.description}</td>
              <td>{r.amount}</td>
              <td><button onClick={() => deleteRow(r.id)}>❌</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
