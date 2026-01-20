"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/PageContainer";
import KPICard from "@/components/KPICard";
import PipelineProgress from "@/components/PipelineProgress";
import FileUpload from "@/components/FileUpload";
import { useDatasetStore } from "@/lib/datasetStore";
import api from "@/lib/api";

export default function OverviewPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const store = useDatasetStore();
  const hasData = store.rawData.length > 0;

  // Run the analysis pipeline when data is uploaded
  const runAnalysisPipeline = async () => {
    if (!store.rawData.length) return;

    setAnalyzing(true);
    setPipelineError(null);

    try {
      // Step 1: Cleaning
      store.setLoading("cleaning", true);
      const cleaningResult = await api.cleaning(store.rawData);
      store.setCleanedData(cleaningResult.cleanedData);
      if (cleaningResult.cleaningLog) {
        store.setCleaningLog(cleaningResult.cleaningLog);
      }
      store.setPipelineStatus("cleaningComplete", true);
      store.setLoading("cleaning", false);

      // Step 2: Column Types
      store.setLoading("columnTypes", true);
      const columnTypesResult = await api.columnTypes(cleaningResult.cleanedData);
      store.setColumnProfile(columnTypesResult);
      store.setPipelineStatus("columnTypesComplete", true);
      store.setLoading("columnTypes", false);

      // Step 3: Descriptive
      store.setLoading("descriptive", true);
      const descriptiveResult = await api.descriptive(
        cleaningResult.cleanedData,
        columnTypesResult
      );
      store.setDescriptiveStats({
        numeric: descriptiveResult.numericStats || [],
        categorical: descriptiveResult.categoricalStats || [],
      });
      store.setPipelineStatus("descriptiveComplete", true);
      store.setLoading("descriptive", false);

      // Step 4: Diagnostic
      store.setLoading("diagnostic", true);
      const diagnosticResult = await api.diagnostic(
        cleaningResult.cleanedData,
        columnTypesResult
      );
      store.setDiagnosticStats({
        correlations: diagnosticResult.correlations || [],
        multicollinearity: diagnosticResult.multicollinearity || [],
        pearsonMatrix: diagnosticResult.pearsonMatrix || [],
      });
      store.setPipelineStatus("diagnosticComplete", true);
      store.setLoading("diagnostic", false);

      // Step 5: Predictive
      store.setLoading("predictive", true);
      try {
        const predictiveResult = await api.predictive(
          cleaningResult.cleanedData,
          columnTypesResult
        );
        store.setPredictiveResults(predictiveResult);
        store.setPipelineStatus("predictiveComplete", true);
      } catch (e) {
        console.warn("Predictive analysis failed:", e);
        // Non-critical, continue
      }
      store.setLoading("predictive", false);

      // Step 6: Prescriptive
      store.setLoading("prescriptive", true);
      try {
        const prescriptiveResult = await api.prescriptive(
          cleaningResult.cleanedData,
          columnTypesResult,
          store.predictiveResults,
          store.diagnosticStats
        );
        store.setPrescriptiveInsights(prescriptiveResult);
        store.setPipelineStatus("prescriptiveComplete", true);
      } catch (e) {
        console.warn("Prescriptive analysis failed:", e);
        // Non-critical, continue
      }
      store.setLoading("prescriptive", false);

      // Update last analyzed timestamp
      store.setLastAnalyzedAt(new Date().toISOString());
    } catch (error) {
      console.error("Analysis pipeline failed:", error);
      setPipelineError(
        error instanceof Error ? error.message : "Analysis pipeline failed"
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Auto-run pipeline when data changes and hasn't been analyzed
  useEffect(() => {
    if (hasData && !store.pipelineStatus.cleaningComplete && !analyzing) {
      runAnalysisPipeline();
    }
  }, [hasData]);

  const handleUploadComplete = async (uploadResult: any) => {
    // Store uploaded data
    store.setRawData(uploadResult.data);
    store.setMetadata({
      datasetName: uploadResult.metadata.filename,
      rows: uploadResult.metadata.rows,
      columns: uploadResult.metadata.columns,
      uploadedAt: new Date().toISOString(),
    });
    store.setPipelineStatus("uploadComplete", true);
    store.setIsLanding(false);
  };

  if (!hasData) {
    return (
      <PageContainer
        title="AutoML Intelligence System"
        subtitle="Upload your dataset to begin automated analysis"
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <FileUpload onUploadComplete={handleUploadComplete} />
        </div>
      </PageContainer>
    );
  }

  // Calculate completeness percentage
  const totalValues =
    (store.metadata?.rows || 0) * (store.metadata?.columns || 0);
  const missingCount =
    store.cleaningLog
      .filter((a: any) => a.action === "impute_missing")
      .reduce((sum: number, a: any) => sum + (a.rowsAffected || 0), 0);
  const completeness =
    totalValues > 0
      ? (((totalValues - Number(missingCount)) / totalValues) * 100).toFixed(1)
      : "100.0";

  const completedTiers = store.getCompletedTiers();

  return (
    <PageContainer
      title="Overview"
      subtitle="Dataset summary and pipeline execution status"
    >
      {/* Error Message */}
      {pipelineError && (
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
          Pipeline error: {pipelineError}
          <button
            onClick={runAnalysisPipeline}
            style={{
              marginLeft: "16px",
              padding: "4px 12px",
              background: "var(--status-error)",
              color: "white",
              border: "none",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "48px",
          paddingBottom: "32px",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: "48px",
        }}
      >
        <KPICard
          label="Rows"
          value={store.metadata?.rows?.toLocaleString() || "0"}
        />
        <KPICard label="Columns" value={String(store.metadata?.columns || 0)} />
        <KPICard
          label="Cleaning Actions"
          value={store.cleaningLog.length.toString()}
          unit="applied"
        />
        <KPICard
          label="Baseline Accuracy"
          value={
            store.predictiveResults?.metrics?.accuracy
              ? (store.predictiveResults.metrics.accuracy * 100).toFixed(1)
              : "—"
          }
          unit={store.predictiveResults?.metrics?.accuracy ? "%" : undefined}
        />
        <KPICard label="Completeness" value={completeness} unit="%" />
      </div>

      {/* Pipeline Progress */}
      <div style={{ marginBottom: "48px" }}>
        {analyzing && (
          <div
            style={{
              fontSize: "13px",
              color: "var(--status-warning)",
              marginBottom: "16px",
              fontWeight: 500,
            }}
          >
            Running analysis pipeline...
          </div>
        )}
        <PipelineProgress currentTier={analyzing ? completedTiers : completedTiers} />
      </div>

      {/* System Summary */}
      <div>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          System Summary
        </h3>
        <div
          style={{
            padding: "24px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            fontSize: "14px",
            lineHeight: "1.7",
            color: "var(--text-secondary)",
          }}
        >
          {analyzing ? (
            <p>Processing dataset through analytical pipeline...</p>
          ) : completedTiers === 0 ? (
            <p>Waiting for analysis to complete...</p>
          ) : (
            <>
              <p style={{ marginBottom: "16px" }}>
                Dataset{" "}
                <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {store.metadata?.datasetName || "unknown"}
                </strong>{" "}
                has been processed through {completedTiers} of 6 analytical tiers.
                {store.columnProfile.length > 0 && (
                  <>
                    {" "}The pipeline identified{" "}
                    <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                      {store.columnProfile.length} semantic columns
                    </strong>{" "}
                    across continuous numeric, discrete numeric, and categorical types.
                  </>
                )}
              </p>
              <p style={{ marginBottom: "16px" }}>
                Data quality assessment:{" "}
                <strong style={{ color: "var(--status-success)", fontWeight: 600 }}>
                  {completeness}% complete
                </strong>
                .{" "}
                {store.cleaningLog.length > 0
                  ? `${store.cleaningLog.length} cleaning operations applied`
                  : "No cleaning required"}
                .
              </p>
              <p>
                {store.predictiveResults
                  ? `Predictive modeling indicates ${store.predictiveResults.targetType} task. 
                     Model trained on ${store.predictiveResults.featuresUsed.length} features 
                     with ${(store.predictiveResults.metrics.accuracy * 100).toFixed(1)}% baseline accuracy.`
                  : completedTiers >= 5
                  ? "Predictive modeling complete. Results available in Tier 5."
                  : "Predictive modeling pending."}
              </p>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
