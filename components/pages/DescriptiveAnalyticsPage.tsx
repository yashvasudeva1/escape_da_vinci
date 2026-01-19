"use client";

import { useState } from "react";
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

const numericStats = {
  tenure: {
    mean: 32.4,
    median: 29,
    std: 24.6,
    skewness: 0.24,
    kurtosis: -1.23,
    cv: 0.76,
  },
  monthly_charges: {
    mean: 64.76,
    median: 70.35,
    std: 30.09,
    skewness: -0.22,
    kurtosis: -1.24,
    cv: 0.46,
  },
  total_charges: {
    mean: 2283.3,
    median: 1397.5,
    std: 2266.8,
    skewness: 1.03,
    kurtosis: -0.07,
    cv: 0.99,
  },
};

const categoricalData = [
  { category: "Male", count: 3555, percent: 50.5 },
  { category: "Female", count: 3488, percent: 49.5 },
];

export default function DescriptiveAnalyticsPage() {
  const [selectedColumn, setSelectedColumn] = useState("tenure");

  return (
    <PageContainer
      title="Descriptive Analytics"
      subtitle="TIER 3 — Statistical summaries and distribution analysis"
    >
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
            minWidth: "250px",
          }}
        >
          <option value="tenure">tenure (Continuous Numeric)</option>
          <option value="monthly_charges">
            monthly_charges (Continuous Numeric)
          </option>
          <option value="total_charges">
            total_charges (Continuous Numeric)
          </option>
          <option value="gender">gender (Categorical)</option>
        </select>
      </div>

      {/* Stats Display */}
      {selectedColumn in numericStats && (
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
            {Object.entries(
              numericStats[selectedColumn as keyof typeof numericStats]
            ).map(([key, value]) => (
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
                  {value.toFixed(2)}
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
              Distribution
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
                <BarChart
                  data={[
                    { range: "0-10", count: 450 },
                    { range: "10-20", count: 890 },
                    { range: "20-30", count: 1240 },
                    { range: "30-40", count: 1450 },
                    { range: "40-50", count: 1380 },
                    { range: "50-60", count: 980 },
                    { range: "60-70", count: 653 },
                  ]}
                >
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

      {selectedColumn === "gender" && (
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
                2
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
                0.99
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
                Male (50.5%)
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
                <BarChart data={categoricalData}>
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
          {selectedColumn === "tenure" &&
            "Near-normal distribution with slight positive skew (0.24). Coefficient of variation (0.76) indicates moderate relative dispersion. Negative kurtosis suggests lighter tails than normal distribution."}
          {selectedColumn === "monthly_charges" &&
            "Slight negative skew (-0.22) indicates left-leaning distribution. Moderate coefficient of variation (0.46) suggests reasonable consistency across customers."}
          {selectedColumn === "total_charges" &&
            "Positive skew (1.03) with high coefficient of variation (0.99) indicates right-skewed distribution with substantial variability, typical for cumulative financial metrics."}
          {selectedColumn === "gender" &&
            "Balanced binary distribution with near-equal representation. High entropy (0.99) confirms minimal bias toward either category."}
        </p>
      </div>
    </PageContainer>
  );
}
