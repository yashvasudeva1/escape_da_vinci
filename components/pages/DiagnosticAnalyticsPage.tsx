"use client";

import { useMemo } from "react";
import PageContainer from "@/components/PageContainer";
import DataTable from "@/components/DataTable";
import { useDatasetStore } from "@/lib/datasetStore";

const correlationColumns = [
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

function getVifStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "acceptable":
      return "var(--status-success)";
    case "moderate":
      return "var(--status-warning)";
    case "high":
      return "var(--status-error)";
    default:
      return "var(--text-secondary)";
  }
}

export default function DiagnosticAnalyticsPage() {
  const store = useDatasetStore();
  const { diagnosticStats, columnProfile, loading, errors } = store;
  const isLoading = loading.diagnostic;
  const error = errors.diagnostic;

  // Transform correlation data for table
  const correlationData = useMemo(() => {
    return diagnosticStats.correlations.map((corr) => ({
      pair: corr.pair,
      pearson: corr.pearson?.toFixed(2) || "—",
      spearman: corr.spearman?.toFixed(2) || "—",
      kendall: corr.kendall?.toFixed(2) || "—",
      interpretation: corr.interpretation,
    }));
  }, [diagnosticStats.correlations]);

  // Transform multicollinearity data for table
  const multicollinearityData = useMemo(() => {
    return diagnosticStats.multicollinearity.map((item) => ({
      feature: item.feature,
      vif: item.vif?.toFixed(2) || "—",
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      color: getVifStatusColor(item.status),
    }));
  }, [diagnosticStats.multicollinearity]);

  // Get numeric columns for heatmap
  const numericColumns = useMemo(() => {
    return columnProfile.filter(
      (col) => col.detectedType === "continuous" || col.detectedType === "discrete"
    );
  }, [columnProfile]);

  // Build correlation matrix from pairs
  const correlationMatrix = useMemo(() => {
    if (diagnosticStats.pearsonMatrix && diagnosticStats.pearsonMatrix.length > 0) {
      return diagnosticStats.pearsonMatrix;
    }
    
    // Build from correlation pairs if matrix not available
    const numCols = numericColumns.map((c) => c.column);
    const size = numCols.length;
    const matrix: number[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(0));

    // Fill diagonal with 1s
    for (let i = 0; i < size; i++) {
      matrix[i][i] = 1;
    }

    // Fill from correlation pairs
    diagnosticStats.correlations.forEach((corr) => {
      const [col1, col2] = corr.pair.split(" ↔ ");
      const i = numCols.indexOf(col1);
      const j = numCols.indexOf(col2);
      if (i !== -1 && j !== -1) {
        matrix[i][j] = corr.pearson;
        matrix[j][i] = corr.pearson;
      }
    });

    return matrix;
  }, [diagnosticStats, numericColumns]);

  // Get key findings summary
  const keyFindings = useMemo(() => {
    const findings: string[] = [];

    // Strong correlations
    const strongCorrs = diagnosticStats.correlations.filter(
      (c) => Math.abs(c.pearson) >= 0.7
    );
    if (strongCorrs.length > 0) {
      const strongest = strongCorrs.reduce((a, b) =>
        Math.abs(a.pearson) > Math.abs(b.pearson) ? a : b
      );
      findings.push(
        `Strong correlation detected between ${strongest.pair} (Pearson r = ${strongest.pearson.toFixed(2)}). ${strongest.interpretation}`
      );
    }

    // High VIF warnings
    const highVif = diagnosticStats.multicollinearity.filter(
      (m) => m.status === "high"
    );
    if (highVif.length > 0) {
      findings.push(
        `High multicollinearity detected in ${highVif.map((h) => h.feature).join(", ")} (VIF > 10). Consider feature selection or dimensionality reduction.`
      );
    }

    // Moderate VIF notes
    const moderateVif = diagnosticStats.multicollinearity.filter(
      (m) => m.status === "moderate"
    );
    if (moderateVif.length > 0) {
      findings.push(
        `Moderate VIF scores for ${moderateVif.map((m) => m.feature).join(", ")}. Monitor for potential redundancy in linear models.`
      );
    }

    if (findings.length === 0) {
      findings.push("No significant multicollinearity issues detected. Feature set appears suitable for modeling.");
    }

    return findings;
  }, [diagnosticStats]);

  // Empty state
  if (!isLoading && correlationData.length === 0 && multicollinearityData.length === 0) {
    return (
      <PageContainer
        title="Diagnostic Analytics"
        subtitle="TIER 4 — Correlation analysis and multicollinearity diagnostics"
      >
        <div
          style={{
            padding: "64px",
            textAlign: "center",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-tertiary)",
            fontSize: "14px",
          }}
        >
          No diagnostic data available. Please upload a dataset with numeric features first.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Diagnostic Analytics"
      subtitle="TIER 4 — Correlation analysis and multicollinearity diagnostics"
    >
      {/* Loading State */}
      {isLoading && (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "24px",
            color: "var(--text-secondary)",
            fontSize: "14px",
          }}
        >
          Computing diagnostic statistics...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            padding: "16px 20px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--status-error)",
            color: "var(--status-error)",
            fontSize: "13px",
            marginBottom: "24px",
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Correlation Analysis */}
      {correlationData.length > 0 && (
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
          <DataTable columns={correlationColumns} data={correlationData} />
        </div>
      )}

      {/* Multicollinearity */}
      {multicollinearityData.length > 0 && (
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
      )}

      {/* Correlation Heatmap */}
      {numericColumns.length > 0 && correlationMatrix.length > 0 && (
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
              padding: "24px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                borderCollapse: "collapse",
                fontSize: "12px",
                width: "auto",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-subtle)",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  ></th>
                  {numericColumns.map((col) => (
                    <th
                      key={col.column}
                      style={{
                        padding: "8px 12px",
                        textAlign: "center",
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-subtle)",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        minWidth: "80px",
                      }}
                    >
                      {col.column.length > 12
                        ? col.column.slice(0, 12) + "..."
                        : col.column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {numericColumns.map((rowCol, i) => (
                  <tr key={rowCol.column}>
                    <td
                      style={{
                        padding: "8px 12px",
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-subtle)",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {rowCol.column.length > 12
                        ? rowCol.column.slice(0, 12) + "..."
                        : rowCol.column}
                    </td>
                    {numericColumns.map((colCol, j) => {
                      const value = correlationMatrix[i]?.[j] ?? 0;
                      const absValue = Math.abs(value);
                      let bgColor = "var(--bg-secondary)";
                      if (i !== j) {
                        if (absValue >= 0.7) {
                          bgColor = value > 0 ? "#15803d33" : "#b91c1c33";
                        } else if (absValue >= 0.4) {
                          bgColor = value > 0 ? "#15803d1a" : "#b91c1c1a";
                        }
                      } else {
                        bgColor = "var(--bg-tertiary)";
                      }
                      return (
                        <td
                          key={colCol.column}
                          style={{
                            padding: "8px 12px",
                            textAlign: "center",
                            border: "1px solid var(--border-subtle)",
                            background: bgColor,
                            color:
                              absValue >= 0.7
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                            fontWeight: absValue >= 0.7 ? 600 : 400,
                          }}
                        >
                          {value.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            style={{
              marginTop: "12px",
              fontSize: "11px",
              color: "var(--text-tertiary)",
            }}
          >
            {numericColumns.length} numeric features analyzed
          </div>
        </div>
      )}

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
        {keyFindings.map((finding, idx) => (
          <p key={idx} style={{ marginBottom: idx < keyFindings.length - 1 ? "12px" : 0 }}>
            {finding}
          </p>
        ))}
      </div>
    </PageContainer>
  );
}
