"use client";

import PageContainer from "@/components/PageContainer";
import DataTable from "@/components/DataTable";

const correlationData = [
  {
    pair: "tenure ↔ total_charges",
    pearson: 0.83,
    spearman: 0.89,
    kendall: 0.71,
    interpretation: "Strong positive monotonic relationship",
  },
  {
    pair: "monthly_charges ↔ total_charges",
    pearson: 0.65,
    spearman: 0.62,
    kendall: 0.47,
    interpretation: "Moderate positive correlation",
  },
  {
    pair: "tenure ↔ monthly_charges",
    pearson: 0.25,
    spearman: 0.28,
    kendall: 0.19,
    interpretation: "Weak positive correlation",
  },
];

const multicollinearityData = [
  {
    feature: "tenure",
    vif: 1.34,
    status: "Acceptable",
    color: "var(--status-success)",
  },
  {
    feature: "monthly_charges",
    vif: 2.18,
    status: "Acceptable",
    color: "var(--status-success)",
  },
  {
    feature: "total_charges",
    vif: 3.92,
    status: "Moderate",
    color: "var(--status-warning)",
  },
];

const columns = [
  { key: "pair", label: "Feature Pair", sortable: true, width: "25%" },
  { key: "pearson", label: "Pearson r", sortable: true, width: "15%" },
  { key: "spearman", label: "Spearman ρ", sortable: true, width: "15%" },
  { key: "kendall", label: "Kendall τ", sortable: true, width: "15%" },
  {
    key: "interpretation",
    label: "Interpretation",
    sortable: false,
    width: "30%",
  },
];

const vifColumns = [
  { key: "feature", label: "Feature", sortable: true, width: "40%" },
  { key: "vif", label: "VIF Score", sortable: true, width: "20%" },
  { key: "status", label: "Status", sortable: true, width: "40%" },
];

export default function DiagnosticAnalyticsPage() {
  return (
    <PageContainer
      title="Diagnostic Analytics"
      subtitle="TIER 4 — Correlation analysis and multicollinearity diagnostics"
    >
      {/* Correlation Analysis */}
      <div style={{ marginBottom: "48px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          Strong Correlations
        </h3>
        <DataTable columns={columns} data={correlationData} />
      </div>

      {/* Multicollinearity */}
      <div style={{ marginBottom: "48px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          Multicollinearity Detection (VIF Analysis)
        </h3>
        <DataTable columns={vifColumns} data={multicollinearityData} />
        <div
          style={{
            marginTop: "16px",
            padding: "16px 20px",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-subtle)",
            fontSize: "12px",
            color: "var(--text-tertiary)",
          }}
        >
          VIF Thresholds: &lt; 5 = Acceptable · 5-10 = Moderate · &gt; 10 = High
          multicollinearity
        </div>
      </div>

      {/* Correlation Heatmap Placeholder */}
      <div style={{ marginBottom: "48px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          Pearson Correlation Matrix
        </h3>
        <div
          style={{
            padding: "48px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "400px",
            color: "var(--text-tertiary)",
            fontSize: "13px",
          }}
        >
          Correlation heatmap visualization (3 numeric features)
        </div>
      </div>

      {/* Key Findings */}
      <div
        style={{
          padding: "20px 24px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          fontSize: "13px",
          color: "var(--text-secondary)",
          lineHeight: "1.6",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          Key Findings
        </div>
        <p style={{ marginBottom: "12px" }}>
          <strong style={{ color: "var(--text-primary)" }}>
            Strong monotonic relationship
          </strong>{" "}
          detected between tenure and total_charges (Spearman ρ = 0.89). This is
          expected as total charges accumulate over customer tenure. Spearman
          correlation exceeds Pearson, indicating non-linear monotonic pattern.
        </p>
        <p>
          Multicollinearity assessment: total_charges shows moderate VIF (3.92),
          suggesting some redundancy with tenure. Consider feature engineering
          or dimensionality reduction if building linear models. No features
          exceed critical VIF threshold of 10.
        </p>
      </div>
    </PageContainer>
  );
}
