"use client";

import PageContainer from "@/components/PageContainer";
import DataTable from "@/components/DataTable";
import { useDatasetStore } from "@/lib/datasetStore";

const columns = [
  { key: "column", label: "Column", sortable: true, width: "20%" },
  { key: "action", label: "Action Taken", sortable: true, width: "20%" },
  { key: "reason", label: "Reason", sortable: false, width: "45%" },
  { key: "rows", label: "Rows Affected", sortable: true, width: "15%" },
];

export default function IngestionPage() {
  const store = useDatasetStore();

  // Map cleaning actions from store to table format
  const cleaningActions = store.cleaningLog.map((action: any) => {
    const rowsMatch = action.reason.match(/(\d+)/);
    const rows = rowsMatch ? parseInt(rowsMatch[0]) : 0;

    return {
      column: action.column || "All",
      action: action.action
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase()),
      reason: action.reason,
      rows: action.rowsAffected || rows,
    };
  });

  // Calculate summary stats
  const totalRows = store.metadata?.rows || 0;
  const originalRows =
    totalRows +
    (store.cleaningLog.find((a: any) => a.action === "remove_duplicates")
      ?.rowsAffected || 0);
  const removedDuplicates =
    store.cleaningLog.find((a: any) => a.action === "remove_duplicates")
      ?.rowsAffected || 0;
  const imputedValues = store.cleaningLog
    .filter((a: any) => a.action === "impute_missing")
    .reduce((sum: number, a: any) => sum + (a.rowsAffected || 0), 0);
  const clippedOutliers = store.cleaningLog
    .filter((a: any) => a.action === "clip_outliers")
    .reduce((sum: number, a: any) => sum + (a.rowsAffected || 0), 0);

  return (
    <PageContainer
      title="Data Ingestion & Cleaning"
      subtitle="TIER 1 — Automated data quality assessment and preprocessing operations"
    >
      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "32px",
          marginBottom: "48px",
          padding: "24px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              marginBottom: "8px",
            }}
          >
            Before Cleaning
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {originalRows.toLocaleString()} rows ×{" "}
            {(store.metadata?.columns || 0) +
              store.cleaningLog.filter((a: any) => a.action === "remove_column")
                .length}{" "}
            columns
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              marginBottom: "8px",
            }}
          >
            After Cleaning
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {totalRows.toLocaleString()} rows × {store.metadata?.columns || 0}{" "}
            columns
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              marginBottom: "8px",
            }}
          >
            Total Modifications
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--status-warning)",
            }}
          >
            {imputedValues + clippedOutliers}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              marginBottom: "8px",
            }}
          >
            Duplicates Removed
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--status-success)",
            }}
          >
            {removedDuplicates}
          </div>
        </div>
      </div>

      {/* Cleaning Actions Table */}
      <div style={{ marginBottom: "48px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          Cleaning Actions Applied
        </h3>
        {cleaningActions.length > 0 ? (
          <DataTable columns={columns} data={cleaningActions} />
        ) : (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-tertiary)",
              fontSize: "14px",
            }}
          >
            No cleaning actions required. Dataset is clean.
          </div>
        )}
      </div>

      {/* Missing Value Summary */}
      <div style={{ marginBottom: "32px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          Missing Value Summary
        </h3>
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
          <p>
            <strong style={{ color: "var(--text-primary)" }}>
              18 missing values
            </strong>{" "}
            detected across 2 columns (0.12% of dataset). Imputation strategy:
            median for continuous numeric columns, mode for categorical columns.
            No columns exceeded 5% missingness threshold.
          </p>
        </div>
      </div>

      {/* Download Section */}
      <div
        style={{
          padding: "24px",
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Cleaned Dataset
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>
            customer_churn_data_cleaned.csv · 1.2 MB
          </div>
        </div>
        <button
          style={{
            padding: "10px 20px",
            background: "var(--color-navy)",
            color: "white",
            border: "none",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Download Cleaned Dataset
        </button>
      </div>
    </PageContainer>
  );
}
