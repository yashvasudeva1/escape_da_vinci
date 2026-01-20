"use client";

import { useState, useMemo } from "react";
import PageContainer from "@/components/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDatasetStore } from "@/lib/datasetStore";

export default function DescriptiveAnalyticsPage() {
  const store = useDatasetStore();
  const { descriptiveStats, columnProfile, loading, errors } = store;
  const isLoading = loading.descriptive;
  const error = errors.descriptive;

  // Get numeric and categorical columns from store
  const numericColumns = useMemo(() => {
    return columnProfile.filter(
      (col) => col.detectedType === "continuous" || col.detectedType === "discrete"
    );
  }, [columnProfile]);

  const categoricalColumns = useMemo(() => {
    return columnProfile.filter((col) => col.detectedType === "categorical");
  }, [columnProfile]);

  const allColumns = useMemo(() => {
    return [...numericColumns, ...categoricalColumns];
  }, [numericColumns, categoricalColumns]);

  const [selectedColumn, setSelectedColumn] = useState<string>("");

  // Set default selected column when data loads
  useMemo(() => {
    if (allColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(allColumns[0].column);
    }
  }, [allColumns, selectedColumn]);

  // Get stats for selected column
  const selectedNumericStats = useMemo(() => {
    if (!selectedColumn) return null;
    return descriptiveStats.numeric.find((s) => s.column === selectedColumn);
  }, [descriptiveStats.numeric, selectedColumn]);

  const selectedCategoricalStats = useMemo(() => {
    if (!selectedColumn) return null;
    return descriptiveStats.categorical.find((s) => s.column === selectedColumn);
  }, [descriptiveStats.categorical, selectedColumn]);

  const isNumeric = numericColumns.some((c) => c.column === selectedColumn);
  const isCategorical = categoricalColumns.some((c) => c.column === selectedColumn);

  // Generate histogram data for numeric columns
  const histogramData = useMemo(() => {
    if (!selectedNumericStats) return [];
    const { min, max, mean, std } = selectedNumericStats;
    // Generate approximate histogram bins
    const range = max - min;
    const binCount = 7;
    const binWidth = range / binCount;
    const bins = [];
    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      // Approximate normal distribution around mean
      const z = (binStart + binEnd) / 2;
      const normalizedZ = (z - mean) / (std || 1);
      const count = Math.round(
        1000 * Math.exp(-0.5 * normalizedZ * normalizedZ)
      );
      bins.push({
        range: `${binStart.toFixed(0)}-${binEnd.toFixed(0)}`,
        count: Math.max(50, count),
      });
    }
    return bins;
  }, [selectedNumericStats]);

  // Generate frequency data for categorical columns
  const frequencyData = useMemo(() => {
    if (!selectedCategoricalStats) return [];
    return (
      selectedCategoricalStats.topCategories?.map((cat) => ({
        category: cat.value,
        count: cat.count,
        percent: cat.percent,
      })) || []
    );
  }, [selectedCategoricalStats]);

  // Empty state
  if (!isLoading && allColumns.length === 0) {
    return (
      <PageContainer
        title="Descriptive Analytics"
        subtitle="TIER 3 — Statistical summaries and distribution analysis"
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
          No descriptive statistics available. Please upload a dataset first.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Descriptive Analytics"
      subtitle="TIER 3 — Statistical summaries and distribution analysis"
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
          Computing descriptive statistics...
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

      {/* Column Selector */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          Select Column
        </div>
        <select
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
          style={{
            padding: "10px 16px",
            border: "1px solid var(--border-standard)",
            background: "var(--bg-secondary)",
            fontSize: "13px",
            color: "var(--text-secondary)",
            cursor: "pointer",
            minWidth: "300px",
          }}
        >
          {allColumns.map((col) => (
            <option key={col.column} value={col.column}>
              {col.column} ({col.detectedType === "continuous" || col.detectedType === "discrete"
                ? `${col.detectedType === "continuous" ? "Continuous" : "Discrete"} Numeric`
                : "Categorical"})
            </option>
          ))}
        </select>
      </div>

      {/* Numeric Stats Display */}
      {isNumeric && selectedNumericStats && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "24px",
              marginBottom: "48px",
              padding: "24px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {[
              { key: "mean", value: selectedNumericStats.mean },
              { key: "median", value: selectedNumericStats.median },
              { key: "std", value: selectedNumericStats.std },
              { key: "skewness", value: selectedNumericStats.skewness },
              { key: "kurtosis", value: selectedNumericStats.kurtosis },
              { key: "cv", value: selectedNumericStats.cv },
            ].map(({ key, value }) => (
              <div key={key}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  {key}
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {typeof value === "number" ? value.toFixed(2) : "—"}
                </div>
              </div>
            ))}
          </div>

          {/* Range Stats */}
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
            {[
              { key: "min", value: selectedNumericStats.min },
              { key: "q25", value: selectedNumericStats.q25 },
              { key: "q75", value: selectedNumericStats.q75 },
              { key: "max", value: selectedNumericStats.max },
            ].map(({ key, value }) => (
              <div key={key}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  {key === "q25" ? "25th Percentile" : key === "q75" ? "75th Percentile" : key}
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {typeof value === "number" ? value.toFixed(2) : "—"}
                </div>
              </div>
            ))}
          </div>

          {/* Distribution Chart */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Distribution (Approximate)
            </h3>
            <div
              style={{
                padding: "24px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                height: "300px",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                  />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-standard)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-navy)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Categorical Stats Display */}
      {isCategorical && selectedCategoricalStats && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
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
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                }}
              >
                Unique Categories
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {selectedCategoricalStats.uniqueCount}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                }}
              >
                Entropy
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {selectedCategoricalStats.entropy?.toFixed(2) || "—"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                }}
              >
                Dominant Category
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {selectedCategoricalStats.dominantCategory} (
                {selectedCategoricalStats.dominantPct?.toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Frequency Chart */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Frequency Distribution
            </h3>
            <div
              style={{
                padding: "24px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                height: "300px",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                  />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-standard)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-navy)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Insights */}
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
          Distribution Insights
        </div>
        <p>
          {selectedNumericStats && (
            <>
              {selectedNumericStats.skewness > 0.5
                ? `Positive skew (${selectedNumericStats.skewness.toFixed(2)}) indicates right-skewed distribution with longer right tail. `
                : selectedNumericStats.skewness < -0.5
                ? `Negative skew (${selectedNumericStats.skewness.toFixed(2)}) indicates left-skewed distribution with longer left tail. `
                : `Near-normal distribution with slight skew (${selectedNumericStats.skewness.toFixed(2)}). `}
              Coefficient of variation ({selectedNumericStats.cv.toFixed(2)}) indicates{" "}
              {selectedNumericStats.cv > 0.8
                ? "high"
                : selectedNumericStats.cv > 0.3
                ? "moderate"
                : "low"}{" "}
              relative dispersion.
            </>
          )}
          {selectedCategoricalStats && (
            <>
              {selectedCategoricalStats.uniqueCount <= 2
                ? "Binary distribution"
                : `Multi-class distribution with ${selectedCategoricalStats.uniqueCount} categories`}
              .{" "}
              {selectedCategoricalStats.entropy && selectedCategoricalStats.entropy > 0.9
                ? "High entropy confirms balanced distribution across categories."
                : selectedCategoricalStats.entropy && selectedCategoricalStats.entropy < 0.5
                ? "Low entropy indicates imbalanced distribution with dominant category."
                : "Moderate entropy suggests some category imbalance."}
            </>
          )}
          {!selectedNumericStats && !selectedCategoricalStats && "Select a column to view distribution insights."}
        </p>
      </div>
    </PageContainer>
  );
}
