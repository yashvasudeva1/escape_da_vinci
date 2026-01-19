"use client";

import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import KPICard from "@/components/KPICard";
import PipelineProgress from "@/components/PipelineProgress";
import FileUpload from "@/components/FileUpload";
import { useDatasetStore } from "@/lib/datasetStore";

export default function OverviewPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [completedTiers, setCompletedTiers] = useState(0);
  const store = useDatasetStore();
  const hasData = store.rawData.length > 0;

  const handleUploadComplete = async (uploadResult: any) => {
    // Store uploaded data
    store.setRawData(uploadResult.data);
    store.setMetadata({
      datasetName: uploadResult.metadata.filename,
      rows: uploadResult.metadata.rows,
      columns: uploadResult.metadata.columns,
      uploadedAt: new Date().toISOString(),
    });

    // Run full analysis pipeline
    setAnalyzing(true);
    setCompletedTiers(0);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: uploadResult.data,
          columnProfile: [],
        }),
      });

      const results = await response.json();

      // Update store with results
      if (results.cleaning) {
        store.setCleanedData(results.cleaning.cleanedData);
        results.cleaning.cleaningActions?.forEach((action: any) => {
          store.addCleaningAction(action);
        });
        setCompletedTiers(1);
      }

      if (results.columnProfile) {
        store.setColumnProfile(results.columnProfile);
        setCompletedTiers(2);
      }

      if (results.descriptive) {
        store.setDescriptiveStats(results.descriptive);
        setCompletedTiers(3);
      }

      if (results.diagnostic) {
        store.setDiagnosticStats(results.diagnostic);
        setCompletedTiers(4);
      }

      if (results.predictive) {
        store.setPredictiveResults(results.predictive);
        setCompletedTiers(5);
      }

      if (results.prescriptive) {
        store.setPrescriptiveInsights(results.prescriptive);
        setCompletedTiers(6);
      }
    } catch (error) {
      console.error("Analysis pipeline failed:", error);
    } finally {
      setAnalyzing(false);
    }
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
      .find((a: any) => a.action === "impute_missing")
      ?.reason.split(" ")[0] || 0;
  const completeness =
    totalValues > 0
      ? (((totalValues - Number(missingCount)) / totalValues) * 100).toFixed(1)
      : "0.0";

  return (
    <PageContainer
      title="Overview"
      subtitle="Dataset summary and pipeline execution status"
    >
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
          label="Missing Values"
          value={missingCount.toString()}
          unit="values"
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
            ⚡ Running analysis pipeline...
          </div>
        )}
        <PipelineProgress currentTier={analyzing ? completedTiers : 6} />
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
          <p style={{ marginBottom: "16px" }}>
            Dataset{" "}
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {store.metadata?.datasetName || "unknown"}
            </strong>{" "}
            has been successfully processed through all six analytical tiers.
            The pipeline identified{" "}
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {store.columnProfile.length} semantic columns
            </strong>{" "}
            across continuous numeric, discrete numeric, and categorical types.
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
              ? `Predictive modeling indicates ${
                  store.predictiveResults.targetType
                } task. 
                 Model trained on ${
                   store.predictiveResults.featuresUsed.length
                 } features 
                 with ${(
                   store.predictiveResults.metrics.accuracy * 100
                 ).toFixed(1)}% baseline accuracy.`
              : "Predictive modeling complete. Results available in Tier 5."}
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
