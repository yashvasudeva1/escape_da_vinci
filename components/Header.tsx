"use client";

import { useDatasetStore } from "@/lib/datasetStore";
import api from "@/lib/api";

export default function Header() {
  const store = useDatasetStore();
  const { metadata, lastAnalyzedAt, loading } = store;

  // Calculate time since last analysis
  const getTimeSinceAnalysis = () => {
    if (!lastAnalyzedAt) return "Not analyzed";
    const diff = Date.now() - new Date(lastAnalyzedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleExport = async () => {
    store.setLoading("export", true);
    try {
      const blob = await api.exportData("csv", "cleaned-data");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${metadata.datasetName.replace(/\.[^/.]+$/, "")}_cleaned.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      store.setLoading("export", false);
    }
  };

  const handleRemoveDataset = () => {
    if (window.confirm("Are you sure you want to remove the current dataset? This will clear all analysis results.")) {
      store.reset();
    }
  };

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
        {metadata.datasetName && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              alignItems: "flex-end",
            }}
          >
            <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
              {metadata.datasetName}
            </div>
            <div style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
              {metadata.rows.toLocaleString()} rows × {metadata.columns} columns
            </div>
          </div>
        )}

        <div
          style={{
            color: "var(--text-tertiary)",
            fontSize: "12px",
            paddingLeft: "32px",
            borderLeft: "1px solid var(--border-subtle)",
          }}
        >
          Last analyzed: {getTimeSinceAnalysis()}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {metadata.datasetName && (
            <button
              onClick={handleRemoveDataset}
              style={{
                padding: "8px 16px",
                background: "transparent",
                color: "var(--status-error)",
                border: "1px solid var(--status-error)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "4px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              title="Remove dataset and return to landing page"
            >
              Remove Dataset
            </button>
          )}

          <button
            onClick={handleExport}
            disabled={loading.export || !metadata.datasetName}
            style={{
              padding: "8px 16px",
              background: loading.export ? "var(--color-slate)" : "var(--color-navy)",
              color: "white",
              border: "none",
              fontSize: "13px",
              fontWeight: 500,
              cursor: loading.export || !metadata.datasetName ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
              opacity: !metadata.datasetName ? 0.5 : 1,
              borderRadius: "4px",
            }}
            onMouseOver={(e) => {
              if (!loading.export && metadata.datasetName) {
                e.currentTarget.style.opacity = "0.9";
              }
            }}
            onMouseOut={(e) => {
              if (metadata.datasetName) {
                e.currentTarget.style.opacity = "1";
              }
            }}
          >
            {loading.export ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </header>
  );
}
