"use client";

type NavigationItem = {
  id: string;
  label: string;
  tier?: number;
};

const navItems: NavigationItem[] = [
  { id: "overview", label: "Overview" },
  { id: "ingestion", label: "Data Ingestion & Cleaning", tier: 1 },
  { id: "columns", label: "Column Intelligence", tier: 2 },
  { id: "descriptive", label: "Descriptive Analytics", tier: 3 },
  { id: "diagnostic", label: "Diagnostic Analytics", tier: 4 },
  { id: "predictive", label: "Predictive Analytics", tier: 5 },
  { id: "prescriptive", label: "Prescriptive Analytics", tier: 6 },
  { id: "export", label: "Export & Reports" },
  { id: "assistant", label: "AI Assistant" },
];

export default function Navigation({
  activeItem,
  setActiveItem,
}: {
  activeItem: string;
  setActiveItem: (id: string) => void;
}) {
  return (
    <nav
      style={{
        width: "280px",
        height: "calc(100vh - 72px)",
        borderRight: "1px solid var(--border-subtle)",
        background: "var(--bg-secondary)",
        padding: "32px 0",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: "72px",
      }}
    >
      <div
        style={{
          paddingLeft: "24px",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
          }}
        >
          Navigation
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            style={{
              padding: "12px 24px",
              background: "transparent",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              transition: "background 0.15s",
              color:
                activeItem === item.id
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              fontWeight: activeItem === item.id ? 500 : 400,
              fontSize: "14px",
              borderLeft:
                activeItem === item.id
                  ? "3px solid var(--color-navy)"
                  : "3px solid transparent",
            }}
            onMouseOver={(e) => {
              if (activeItem !== item.id) {
                e.currentTarget.style.background = "var(--bg-tertiary)";
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {item.tier && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  fontWeight: 600,
                  minWidth: "16px",
                }}
              >
                T{item.tier}
              </span>
            )}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
