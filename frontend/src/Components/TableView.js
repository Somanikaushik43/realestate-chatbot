import React from "react";
import "./table.css"; // important!

export default function TableView({ rows }) {
  if (!rows || rows.length === 0) return <p>No rows available.</p>;

  const columns = Object.keys(rows[0] || {});

  return (
    <div className="table-scroll-container">
      <table className="table custom-table table-dark table-striped table-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className="no-wrap">{c}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              {columns.map((c) => (
                <td key={c} className="no-wrap">{String(r[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
