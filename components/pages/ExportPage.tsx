"use client";

import { useState, useMemo } from "react";
import PageContainer from "@/components/PageContainer";
import { useDatasetStore } from "@/lib/datasetStore";
import api from "@/lib/api";

interface ExportItem {
  id: string;
  title: string;
  description: string;
  format: "csv" | "json";
  exportType: string;
  enabled: boolean;
  size?: string;
}

export default function ExportPage() {
  const store = useDatasetStore();
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasCleanedData = store.cleanedData.length > 0;
  const hasDescriptive = store.descriptiveStats.numeric.length > 0 || 
                         store.descriptiveStats.categorical.length > 0;
  const hasDiagnostic = store.diagnosticStats.correlations.length > 0;
  const hasPredictive = store.predictiveResults !== null;
  const hasPrescriptive = store.prescriptiveInsights.featureEngineering.length > 0 ||
                          store.prescriptiveInsights.dataQualityRisks.length > 0;

  // Calculate approximate file sizes
  const estimateSize = (data: any): string => {
    const bytes = JSON.stringify(data).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const exportItems: ExportItem[] = useMemo(() => [
    {
      id: "cleaned-dataset",
      title: "Cleaned Dataset",
      description: "Preprocessed data with all cleaning operations applied",
      format: "csv",
      exportType: "cleaned-data",
      enabled: hasCleanedData,
      size: hasCleanedData ? estimateSize(store.cleanedData) : undefined,
    },
    {
      id: "raw-dataset",
      title: "Raw Dataset",
      description: "Original uploaded dataset before cleaning",
      format: "csv",
      exportType: "raw-data",
      enabled: store.rawData.length > 0,
      size: store.rawData.length > 0 ? estimateSize(store.rawData) : undefined,
    },
    {
      id: "cleaning-log",
      title: "Cleaning Log",
      description: "Detailed log of all data cleaning operations performed",
      format: "json",
      exportType: "cleaning-log",
      enabled: store.cleaningLog.length > 0,
      size: store.cleaningLog.length > 0 ? estimateSize(store.cleaningLog) : undefined,
    },
    {
      id: "column-profile",
      title: "Column Profile",
      description: "Column type classifications and metadata",
      format: "json",
      exportType: "column-profile",
      enabled: store.columnProfile.length > 0,
      size: store.columnProfile.length > 0 ? estimateSize(store.columnProfile) : undefined,
    },
    {
      id: "descriptive-stats",
      title: "Descriptive Statistics",
      description: "Statistical summaries for numeric and categorical columns",
      format: "json",
      exportType: "descriptive-stats",
      enabled: hasDescriptive,
      size: hasDescriptive ? estimateSize(store.descriptiveStats) : undefined,
    },
    {
      id: "correlations",
      title: "Correlation Analysis",
      description: "Correlation pairs and multicollinearity diagnostics",
      format: "json",
      exportType: "correlations",
      enabled: hasDiagnostic,
      size: hasDiagnostic ? estimateSize(store.diagnosticStats) : undefined,
    },
    {
      id: "model-results",
      title: "Model Results",
      description: "Baseline model metrics and feature importance scores",
      format: "json",
      exportType: "model-results",
      enabled: hasPredictive,
      size: hasPredictive ? estimateSize(store.predictiveResults) : undefined,
    },
    {
      id: "prescriptive-insights",
      title: "Prescriptive Insights",
      description: "Feature engineering suggestions and business recommendations",
      format: "json",
      exportType: "prescriptive-insights",
      enabled: hasPrescriptive,
      size: hasPrescriptive ? estimateSize(store.prescriptiveInsights) : undefined,
    },
  ], [store, hasCleanedData, hasDescriptive, hasDiagnostic, hasPredictive, hasPrescriptive]);

  const handleExport = async (item: ExportItem) => {
    setExporting(item.id);
    setError(null);

    try {
      let data: any;
      let filename: string;

      switch (item.exportType) {
        case "cleaned-data":
          data = store.cleanedData;
          filename = `${store.metadata.datasetName?.replace(/\.[^/.]+$/, "") || "dataset"}_cleaned.${item.format}`;
          break;
        case "raw-data":
          data = store.rawData;
          filename = `${store.metadata.datasetName?.replace(/\.[^/.]+$/, "") || "dataset"}_raw.${item.format}`;
          break;
        case "cleaning-log":
          data = store.cleaningLog;
          filename = "cleaning_log.json";
          break;
        case "column-profile":
          data = store.columnProfile;
          filename = "column_profile.json";
          break;
        case "descriptive-stats":
          data = store.descriptiveStats;
          filename = "descriptive_statistics.json";
          break;
        case "correlations":
          data = store.diagnosticStats;
          filename = "diagnostic_analysis.json";
          break;
        case "model-results":
          data = store.predictiveResults;
          filename = "model_results.json";
          break;
        case "prescriptive-insights":
          data = store.prescriptiveInsights;
          filename = "prescriptive_insights.json";
          break;
        default:
          throw new Error("Unknown export type");
      }

      // For CSV format, convert data directly on client
      if (item.format === "csv" && Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(",")];
        
        data.forEach((row: any) => {
          const values = headers.map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return "";
            const strValue = String(value);
            if (strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")) {
              return `"${strValue.replace(/"/g, '""')}"`;
            }
            return strValue;
          });
          csvRows.push(values.join(","));
        });
        
        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, filename);
      } else {
        // JSON format - download directly
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        downloadBlob(blob, filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    setExporting("all");
    setError(null);

    try {
      const fullReport = {
        metadata: store.metadata,
        cleaningLog: store.cleaningLog,
        columnProfile: store.columnProfile,
        descriptiveStats: store.descriptiveStats,
        diagnosticStats: store.diagnosticStats,
        predictiveResults: store.predictiveResults,
        prescriptiveInsights: store.prescriptiveInsights,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(fullReport, null, 2)], {
        type: "application/json",
      });
      const filename = `${store.metadata.datasetName?.replace(/\.[^/.]+$/, "") || "automl"}_full_report.json`;
      downloadBlob(blob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  };

  const enabledItems = exportItems.filter((item) => item.enabled);

  return (
    <PageContainer
      title="Export & Reports"
      subtitle="Download analysis outputs, reports, and model artifacts"
    >
      {/* Error Message */}
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

      {enabledItems.length === 0 ? (
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
          No data available for export. Upload and analyze a dataset first.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
            }}
          >
            {exportItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "24px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  opacity: item.enabled ? 1 : 0.5,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "6px",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      lineHeight: "1.5",
                    }}
                  >
                    {item.description}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                      fontFamily: "monospace",
                    }}
                  >
                    .{item.format}{item.size ? ` · ${item.size}` : ""}
                  </div>
                  <button
                    onClick={() => handleExport(item)}
                    disabled={!item.enabled || exporting !== null}
                    style={{
                      padding: "8px 16px",
                      background: item.enabled ? "var(--color-navy)" : "var(--text-tertiary)",
                      color: "white",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: item.enabled && !exporting ? "pointer" : "not-allowed",
                    }}
                  >
                    {exporting === item.id ? "Exporting..." : "Download"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Export */}
          <div
            style={{
              marginTop: "32px",
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
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "6px",
                }}
              >
                Complete Analysis Report
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                All analysis results bundled in a single JSON file
              </div>
            </div>
            <button
              onClick={handleExportAll}
              disabled={exporting !== null}
              style={{
                padding: "12px 24px",
                background: exporting ? "var(--text-tertiary)" : "var(--color-navy)",
                color: "white",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: exporting ? "not-allowed" : "pointer",
              }}
            >
              {exporting === "all" ? "Exporting..." : "Download All"}
            </button>
          </div>
        </>
      )}
    </PageContainer>
  );
}
