"use client";

import { useState, useMemo } from "react";
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
import { useDatasetStore } from "@/lib/datasetStore";
import api from "@/lib/api";

const featureColumns = [
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
  const store = useDatasetStore();
  const { predictiveResults, columnProfile, cleanedData, loading, errors } = store;
  const isLoading = loading.predictive;
  const error = errors.predictive;
  const [isTraining, setIsTraining] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>("");

  const modelTrained = predictiveResults !== null;

  // Get available columns for target selection
  const availableColumns = useMemo(() => {
    if (!columnProfile || columnProfile.length === 0) return [];
    return columnProfile.map(col => ({
      name: col.column,
      type: col.detectedType,
      uniqueValues: col.uniqueValues,
    }));
  }, [columnProfile]);

  // Get recommended target columns (categorical with few unique values or labeled likely targets)
  const recommendedTargets = useMemo(() => {
    if (!columnProfile || columnProfile.length === 0) return [];
    const targetKeywords = ['target', 'label', 'class', 'outcome', 'result', 'category', 'status', 'type', 'grade', 'rating'];
    
    return columnProfile.filter(col => {
      const isLikelyTarget = targetKeywords.some(kw => 
        col.column.toLowerCase().includes(kw)
      );
      const isCategorical = col.detectedType === 'categorical' || 
        (col.detectedType === 'discrete' && col.uniqueValues <= 20);
      return isLikelyTarget || isCategorical;
    }).map(col => col.column);
  }, [columnProfile]);

  // Get target classes if available
  const targetClasses = useMemo(() => {
    if (!predictiveResults || !predictiveResults.targetColumn) return [];
    const targetCol = predictiveResults.targetColumn;
    const uniqueValues = [...new Set(cleanedData.map((row: any) => row[targetCol]))];
    return uniqueValues.slice(0, 10); // Limit to 10 classes for display
  }, [predictiveResults, cleanedData]);

  // Transform feature data for table
  const featureData = useMemo(() => {
    if (!predictiveResults?.featureImportance) return [];
    return predictiveResults.featureImportance.map((item) => ({
      feature: item.feature,
      importance: item.importance.toFixed(3),
      modelReady: "Yes",
    }));
  }, [predictiveResults]);

  // Transform for chart
  const importanceChartData = useMemo(() => {
    if (!predictiveResults?.featureImportance) return [];
    return predictiveResults.featureImportance
      .slice(0, 10)
      .map((item) => ({
        feature: item.feature,
        importance: item.importance,
      }));
  }, [predictiveResults]);

  // Get metrics
  const metrics = useMemo(() => {
    if (!predictiveResults?.metrics) return null;
    return predictiveResults.metrics;
  }, [predictiveResults]);

  // Format metric value
  const formatMetric = (key: string, value: number): string => {
    if (key.toLowerCase().includes("accuracy") || 
        key.toLowerCase().includes("precision") || 
        key.toLowerCase().includes("recall") || 
        key.toLowerCase().includes("f1") ||
        key.toLowerCase().includes("score")) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(3);
  };

  // Train model handler
  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingError(null);
    store.setLoading("predictive", true);

    try {
      const targetColumn = selectedTarget || undefined;
      const result = await api.predictive(cleanedData, columnProfile, targetColumn);
      store.setPredictiveResults(result);
      store.setPipelineStatus("predictiveComplete", true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to train model";
      setTrainingError(message);
      store.setError("predictive", message);
    } finally {
      setIsTraining(false);
      store.setLoading("predictive", false);
    }
  };

  // Empty state
  if (!isLoading && !modelTrained && cleanedData.length === 0) {
    return (
      <PageContainer
        title="Predictive Analytics"
        subtitle="TIER 5 — Automated target detection and baseline model training"
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
          No data available. Please upload a dataset first.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Predictive Analytics"
      subtitle="TIER 5 — Automated target detection and baseline model training"
    >
      {/* Loading State */}
      {(isLoading || isTraining) && (
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
          Training baseline model...
        </div>
      )}

      {/* Error State */}
      {(error || trainingError) && (
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
          Error: {error || trainingError}
        </div>
      )}

      {/* Target Detection */}
      {modelTrained && predictiveResults && (
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
              {predictiveResults.targetColumn}
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
              {predictiveResults.targetType.charAt(0).toUpperCase() + 
               predictiveResults.targetType.slice(1)}
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
              {predictiveResults.targetType === "classification" ? "Target Classes" : "Model Type"}
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {predictiveResults.targetType === "classification"
                ? `${targetClasses.length} (${targetClasses.slice(0, 3).join(", ")}${targetClasses.length > 3 ? "..." : ""})`
                : predictiveResults.modelType}
            </div>
          </div>
        </div>
      )}

      {/* Feature Table */}
      {featureData.length > 0 && (
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
          <DataTable columns={featureColumns} data={featureData} />
        </div>
      )}

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
        </div>

        {/* Target Column Selector - shown when model not trained */}
        {!modelTrained && cleanedData.length > 0 && !isTraining && (
          <div
            style={{
              padding: "24px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              marginBottom: "24px",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                Select Target Column
              </label>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  marginBottom: "12px",
                  lineHeight: "1.5",
                }}
              >
                Choose the column you want to predict. Leave empty for auto-detection.
              </p>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  border: "1px solid var(--border-standard)",
                  borderRadius: "6px",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">Auto-detect target column</option>
                {recommendedTargets.length > 0 && (
                  <optgroup label="Recommended Targets">
                    {recommendedTargets.map((col) => (
                      <option key={`rec-${col}`} value={col}>
                        {col} (recommended)
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="All Columns">
                  {availableColumns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} — {col.type} ({col.uniqueValues} unique)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button
              onClick={handleTrainModel}
              disabled={isTraining}
              style={{
                padding: "12px 24px",
                background: isTraining ? "var(--text-tertiary)" : "var(--color-navy)",
                color: "white",
                border: "none",
                fontSize: "14px",
                fontWeight: 500,
                cursor: isTraining ? "not-allowed" : "pointer",
                borderRadius: "6px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                if (!isTraining) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {isTraining ? "Training..." : "Train Baseline Model"}
            </button>
            
            {selectedTarget && (
              <span
                style={{
                  marginLeft: "16px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                Target: <strong>{selectedTarget}</strong>
              </span>
            )}
          </div>
        )}

        {modelTrained && metrics && (
          <>
            {/* Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(Object.keys(metrics).length, 4)}, 1fr)`,
                gap: "24px",
                marginBottom: "32px",
                padding: "24px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {Object.entries(metrics).slice(0, 8).map(([key, value]) => (
                <div key={key}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                      marginBottom: "8px",
                      textTransform: "capitalize",
                    }}
                  >
                    {key.replace(/_/g, " ")}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatMetric(key, value)}
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Importance Chart */}
            {importanceChartData.length > 0 && (
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
                        formatter={(value: number) => value.toFixed(3)}
                      />
                      <Bar dataKey="importance" fill="var(--color-navy)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Confusion Matrix */}
            {predictiveResults?.confusionMatrix && predictiveResults.confusionMatrix.length > 0 && (
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
                    overflowX: "auto",
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
                        {targetClasses.map((cls, idx) => (
                          <th
                            key={idx}
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                            }}
                          >
                            Pred: {String(cls).slice(0, 8)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {predictiveResults.confusionMatrix.map((row, i) => (
                        <tr key={i}>
                          <td
                            style={{
                              padding: "12px",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                            }}
                          >
                            Actual: {String(targetClasses[i] || i).slice(0, 8)}
                          </td>
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              style={{
                                padding: "16px 32px",
                                textAlign: "center",
                                fontSize: "18px",
                                fontWeight: 600,
                                border: "1px solid var(--border-subtle)",
                                background:
                                  i === j ? "var(--bg-tertiary)" : "transparent",
                                color:
                                  i !== j && cell > 0
                                    ? "var(--status-error)"
                                    : "var(--text-primary)",
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Model Insights */}
      {modelTrained && predictiveResults && (
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
            Baseline {predictiveResults.modelType || "model"} trained on{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {predictiveResults.featuresUsed?.length || 0} features
            </strong>{" "}
            targeting{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {predictiveResults.targetColumn}
            </strong>{" "}
            ({predictiveResults.targetType}).
          </p>
          {metrics && (
            <p>
              {predictiveResults.targetType === "classification" && metrics.accuracy !== undefined && (
                <>
                  Accuracy:{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {(metrics.accuracy * 100).toFixed(1)}%
                  </strong>
                  {metrics.f1_score !== undefined && (
                    <>
                      {" "}| F1 Score:{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        {(metrics.f1_score * 100).toFixed(1)}%
                      </strong>
                    </>
                  )}
                </>
              )}
              {predictiveResults.targetType === "regression" && metrics.r2_score !== undefined && (
                <>
                  R² Score:{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {metrics.r2_score.toFixed(3)}
                  </strong>
                  {metrics.rmse !== undefined && (
                    <>
                      {" "}| RMSE:{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        {metrics.rmse.toFixed(3)}
                      </strong>
                    </>
                  )}
                </>
              )}
              . Consider feature engineering and hyperparameter tuning for improved performance.
            </p>
          )}
        </div>
      )}
    </PageContainer>
  );
}
