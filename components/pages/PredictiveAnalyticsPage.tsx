"use client";

import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import DataTable from "@/components/DataTable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const featureData = [
  { feature: "tenure", importance: 0.28, modelReady: "Yes" },
  { feature: "monthly_charges", importance: 0.22, modelReady: "Yes" },
  { feature: "total_charges", importance: 0.19, modelReady: "Yes" },
  { feature: "contract", importance: 0.16, modelReady: "Yes (encoded)" },
  {
    feature: "internet_service",
    importance: 0.09,
    modelReady: "Yes (encoded)",
  },
  { feature: "payment_method", importance: 0.06, modelReady: "Yes (encoded)" },
];

const importanceChartData = [
  { feature: "tenure", importance: 0.28 },
  { feature: "monthly_charges", importance: 0.22 },
  { feature: "total_charges", importance: 0.19 },
  { feature: "contract", importance: 0.16 },
  { feature: "internet_service", importance: 0.09 },
  { feature: "payment_method", importance: 0.06 },
];

const columns = [
  { key: "feature", label: "Feature", sortable: true, width: "40%" },
  {
    key: "importance",
    label: "Importance Score",
    sortable: true,
    width: "30%",
  },
  { key: "modelReady", label: "Model Ready", sortable: false, width: "30%" },
];

export default function PredictiveAnalyticsPage() {
  const [modelTrained, setModelTrained] = useState(true);

  return (
    <PageContainer
      title="Predictive Analytics"
      subtitle="TIER 5 — Automated target detection and baseline model training"
    >
      {/* Target Detection */}
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
              fontSize: "12px",
              color: "var(--text-tertiary)",
              marginBottom: "8px",
            }}
          >
            Detected Target
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            churn
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
            Task Type
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Classification
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
            Target Classes
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            2 (Yes, No)
          </div>
        </div>
      </div>

      {/* Feature Table */}
      <div style={{ marginBottom: "48px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          Model-Ready Features
        </h3>
        <DataTable columns={columns} data={featureData} />
      </div>

      {/* Model Training */}
      <div style={{ marginBottom: "48px" }}>
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
            Baseline Model
          </h3>
          {!modelTrained && (
            <button
              onClick={() => setModelTrained(true)}
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
              Train Baseline Model
            </button>
          )}
        </div>

        {modelTrained && (
          <>
            {/* Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "24px",
                marginBottom: "32px",
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
                  Accuracy
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  79.3%
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
                  Precision
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  68.2%
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
                  Recall
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  54.7%
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
                  F1 Score
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  60.7%
                </div>
              </div>
            </div>

            {/* Feature Importance */}
            <div style={{ marginBottom: "32px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Feature Importance
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
                  <BarChart data={importanceChartData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-subtle)"
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-standard)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="importance" fill="var(--color-navy)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confusion Matrix */}
            <div style={{ marginBottom: "32px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Confusion Matrix
              </h3>
              <div
                style={{
                  padding: "32px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  display: "inline-block",
                }}
              >
                <table style={{ borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      ></th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        Predicted: No
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        Predicted: Yes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          padding: "12px",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        Actual: No
                      </td>
                      <td
                        style={{
                          padding: "16px 32px",
                          textAlign: "center",
                          background: "var(--bg-tertiary)",
                          fontSize: "18px",
                          fontWeight: 600,
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        1158
                      </td>
                      <td
                        style={{
                          padding: "16px 32px",
                          textAlign: "center",
                          fontSize: "18px",
                          fontWeight: 600,
                          border: "1px solid var(--border-subtle)",
                          color: "var(--status-error)",
                        }}
                      >
                        251
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "12px",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        Actual: Yes
                      </td>
                      <td
                        style={{
                          padding: "16px 32px",
                          textAlign: "center",
                          fontSize: "18px",
                          fontWeight: 600,
                          border: "1px solid var(--border-subtle)",
                          color: "var(--status-error)",
                        }}
                      >
                        140
                      </td>
                      <td
                        style={{
                          padding: "16px 32px",
                          textAlign: "center",
                          background: "var(--bg-tertiary)",
                          fontSize: "18px",
                          fontWeight: 600,
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        169
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Model Insights */}
      {modelTrained && (
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
            Model Assessment
          </div>
          <p style={{ marginBottom: "12px" }}>
            Baseline Random Forest classifier achieves{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              79.3% accuracy
            </strong>{" "}
            with moderate precision (68.2%) and recall (54.7%). Model exhibits
            conservative prediction behavior, favoring false negatives over
            false positives.
          </p>
          <p>
            Top predictive features:{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              tenure (0.28)
            </strong>
            ,
            <strong style={{ color: "var(--text-primary)" }}>
              {" "}
              monthly_charges (0.22)
            </strong>
            , and{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              total_charges (0.19)
            </strong>
            . Contract type shows moderate importance (0.16), suggesting
            contractual commitment impacts churn likelihood. Consider feature
            engineering and hyperparameter tuning to improve recall for minority
            class.
          </p>
        </div>
      )}
    </PageContainer>
  );
}
