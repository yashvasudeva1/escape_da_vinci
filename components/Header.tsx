"use client";

export default function Header() {
  return (
    <header
      style={{
        height: "72px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--color-navy)",
          }}
        >
          AutoML
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-tertiary)",
            fontWeight: 400,
          }}
        >
          Automated Dataset Intelligence System
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
          fontSize: "13px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            alignItems: "flex-end",
          }}
        >
          <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
            customer_churn_data.csv
          </div>
          <div style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
            7,043 rows × 21 columns
          </div>
        </div>

        <div
          style={{
            color: "var(--text-tertiary)",
            fontSize: "12px",
            paddingLeft: "32px",
            borderLeft: "1px solid var(--border-subtle)",
          }}
        >
          Last analyzed: 14m ago
        </div>

        <button
          style={{
            padding: "8px 16px",
            background: "var(--color-navy)",
            color: "white",
            border: "none",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Export
        </button>
      </div>
    </header>
  );
}
