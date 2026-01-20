"use client";

import { useState } from "react";

type Column = {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
};

type DataTableProps = {
  columns: Column[];
  data: any[];
  striped?: boolean;
};

export default function DataTable({
  columns,
  data,
  striped = false,
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string, sortable: boolean = true) => {
    if (!sortable) return;

    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;

    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === bVal) return 0;

    const comparison = aVal > bVal ? 1 : -1;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div
      style={{
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-secondary)",
        overflow: "hidden",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr
            style={{
              background: "var(--bg-tertiary)",
              borderBottom: "1px solid var(--border-standard)",
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key, col.sortable)}
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  cursor: col.sortable ? "pointer" : "default",
                  width: col.width || "auto",
                  fontSize: "12px",
                  letterSpacing: "0.01em",
                }}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span style={{ marginLeft: "4px", fontSize: "10px" }}>
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <tr
              key={idx}
              style={{
                borderBottom:
                  idx < sortedData.length - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
                background:
                  striped && idx % 2 === 1
                    ? "var(--bg-tertiary)"
                    : "transparent",
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "12px 16px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
