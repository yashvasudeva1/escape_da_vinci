"use client";

import { useState, useMemo } from "react";
import PageContainer from "@/components/PageContainer";
import DataTable from "@/components/DataTable";
import { useDatasetStore } from "@/lib/datasetStore";

const columns = [
  { key: "column", label: "Column", sortable: true, width: "18%" },
  { key: "type", label: "Detected Type", sortable: true, width: "18%" },
  { key: "reasoning", label: "Reasoning", sortable: false, width: "40%" },
  { key: "unique", label: "Unique Values", sortable: true, width: "12%" },
  { key: "missing", label: "Missing %", sortable: true, width: "12%" },
];

const typeLabels: Record<string, string> = {
  continuous: "Continuous Numeric",
  discrete: "Discrete Numeric",
  categorical: "Categorical",
  datetime: "Datetime",
  unknown: "Unknown",
};

export default function ColumnIntelligencePage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const store = useDatasetStore();
  const { columnProfile, loading, errors } = store;
  const isLoading = loading.columnTypes;
  const error = errors.columnTypes;

  // Calculate type distribution
  const typeDistribution = useMemo(() => {
    const counts = {
      continuous: 0,
      discrete: 0,
      categorical: 0,
      datetime: 0,
      unknown: 0,
    };
    columnProfile.forEach((col) => {
      const type = col.detectedType;
      if (type in counts) {
        counts[type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [columnProfile]);

  // Transform column profile to table format
  const columnData = useMemo(() => {
    return columnProfile
      .filter((col) => {
        // Apply type filter
        if (typeFilter !== "all" && col.detectedType !== typeFilter) {
          return false;
        }
        // Apply search filter
        if (
          searchQuery &&
          !col.column.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .map((col) => ({
        column: col.column,
        type: typeLabels[col.detectedType] || col.detectedType,
        reasoning: col.reasoning,
        unique: col.uniqueValues,
        missing: `${col.missingPct.toFixed(2)}%`,
      }));
  }, [columnProfile, typeFilter, searchQuery]);

  // Empty state
  if (!isLoading && columnProfile.length === 0) {
    return (
      <PageContainer
        title="Column Intelligence"
        subtitle="TIER 2 — Semantic column type classification and metadata analysis"
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
          No column data available. Please upload a dataset first.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Column Intelligence"
      subtitle="TIER 2 — Semantic column type classification and metadata analysis"
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
          Analyzing column types...
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

      {/* Type Distribution */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "24px",
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
            Continuous Numeric
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {typeDistribution.continuous} column{typeDistribution.continuous !== 1 ? "s" : ""}
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
            Discrete Numeric
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {typeDistribution.discrete} column{typeDistribution.discrete !== 1 ? "s" : ""}
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
            Categorical
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {typeDistribution.categorical} column{typeDistribution.categorical !== 1 ? "s" : ""}
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
            Datetime
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {typeDistribution.datetime} column{typeDistribution.datetime !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Column Table */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Column Analysis
          </h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border-standard)",
                background: "var(--bg-secondary)",
                fontSize: "13px",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <option value="all">All Types</option>
              <option value="continuous">Continuous Numeric</option>
              <option value="discrete">Discrete Numeric</option>
              <option value="categorical">Categorical</option>
              <option value="datetime">Datetime</option>
            </select>
            <input
              type="text"
              placeholder="Search columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border-standard)",
                background: "var(--bg-secondary)",
                fontSize: "13px",
                color: "var(--text-secondary)",
                width: "200px",
              }}
            />
          </div>
        </div>
        {columnData.length > 0 ? (
          <DataTable columns={columns} data={columnData} />
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
            No columns match the current filter.
          </div>
        )}
      </div>

      {/* Detection Methodology */}
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
          Detection Methodology
        </div>
        <p>
          Semantic type classification uses heuristic analysis independent of
          pandas dtype. Continuous numeric: high cardinality ratio (unique/total
          &gt; 0.05), decimal precision, no natural grouping. Discrete numeric:
          low cardinality, integer values, countable states. Categorical: named
          groups, low unique count, string or object dtype with semantic
          meaning.
        </p>
      </div>
    </PageContainer>
  );
}
