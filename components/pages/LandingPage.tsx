"use client";

import { useState, useRef } from "react";
import { useDatasetStore } from "@/lib/datasetStore";
import api from "@/lib/api";

interface LandingPageProps {
  onUploadComplete: () => void;
}

// Sample dataset for demo purposes
const SAMPLE_DATA = [
  { customer_id: 1001, age: 34, income: 65000, credit_score: 720, tenure_months: 24, monthly_spend: 150.50, product_category: "Electronics", churn: 0 },
  { customer_id: 1002, age: 45, income: 85000, credit_score: 680, tenure_months: 36, monthly_spend: 220.75, product_category: "Clothing", churn: 0 },
  { customer_id: 1003, age: 28, income: 45000, credit_score: 650, tenure_months: 12, monthly_spend: 95.25, product_category: "Electronics", churn: 1 },
  { customer_id: 1004, age: 52, income: 105000, credit_score: 780, tenure_months: 48, monthly_spend: 310.00, product_category: "Home", churn: 0 },
  { customer_id: 1005, age: 31, income: 55000, credit_score: 690, tenure_months: 18, monthly_spend: 125.50, product_category: "Electronics", churn: 0 },
  { customer_id: 1006, age: 39, income: 72000, credit_score: 710, tenure_months: 30, monthly_spend: 180.25, product_category: "Clothing", churn: 0 },
  { customer_id: 1007, age: 26, income: 38000, credit_score: 620, tenure_months: 6, monthly_spend: 75.00, product_category: "Electronics", churn: 1 },
  { customer_id: 1008, age: 48, income: 95000, credit_score: 750, tenure_months: 42, monthly_spend: 275.50, product_category: "Home", churn: 0 },
  { customer_id: 1009, age: 35, income: 68000, credit_score: 700, tenure_months: 27, monthly_spend: 165.00, product_category: "Clothing", churn: 0 },
  { customer_id: 1010, age: 29, income: 48000, credit_score: 640, tenure_months: 15, monthly_spend: 110.75, product_category: "Electronics", churn: 1 },
  { customer_id: 1011, age: 43, income: 88000, credit_score: 730, tenure_months: 39, monthly_spend: 245.00, product_category: "Home", churn: 0 },
  { customer_id: 1012, age: 37, income: 70000, credit_score: 695, tenure_months: 33, monthly_spend: 190.50, product_category: "Clothing", churn: 0 },
  { customer_id: 1013, age: 50, income: 98000, credit_score: 760, tenure_months: 45, monthly_spend: 285.25, product_category: "Home", churn: 0 },
  { customer_id: 1014, age: 32, income: 58000, credit_score: 675, tenure_months: 21, monthly_spend: 140.00, product_category: "Electronics", churn: 0 },
  { customer_id: 1015, age: 41, income: 80000, credit_score: 720, tenure_months: 36, monthly_spend: 215.75, product_category: "Clothing", churn: 0 },
  { customer_id: 1016, age: 27, income: 42000, credit_score: 630, tenure_months: 9, monthly_spend: 85.50, product_category: "Electronics", churn: 1 },
  { customer_id: 1017, age: 46, income: 92000, credit_score: 745, tenure_months: 40, monthly_spend: 260.00, product_category: "Home", churn: 0 },
  { customer_id: 1018, age: 33, income: 62000, credit_score: 685, tenure_months: 25, monthly_spend: 155.25, product_category: "Electronics", churn: 0 },
  { customer_id: 1019, age: 38, income: 75000, credit_score: 705, tenure_months: 32, monthly_spend: 195.50, product_category: "Clothing", churn: 0 },
  { customer_id: 1020, age: 30, income: 52000, credit_score: 660, tenure_months: 17, monthly_spend: 120.00, product_category: "Electronics", churn: 1 },
];

export default function LandingPage({ onUploadComplete }: LandingPageProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const store = useDatasetStore();
  const isUploading = store.loading.upload;

  const handleFile = async (file: File) => {
    if (
      !file.name.endsWith(".csv") &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      setError("Please upload a CSV or Excel file.");
      return;
    }

    setError(null);
    store.setLoading("upload", true);
    store.setError("upload", null);

    try {
      const result = await api.upload(file);

      store.setRawData(result.data);
      store.setMetadata({
        datasetName: result.metadata.filename,
        rows: result.metadata.rows,
        columns: result.metadata.columns,
        uploadedAt: new Date().toISOString(),
      });
      store.setPipelineStatus("uploadComplete", true);
      store.setIsLanding(false);

      onUploadComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload file";
      setError(message);
      store.setError("upload", message);
    } finally {
      store.setLoading("upload", false);
    }
  };

  const handleSampleData = () => {
    setLoadingSample(true);
    setError(null);

    // Simulate a brief loading state
    setTimeout(() => {
      store.setRawData(SAMPLE_DATA);
      store.setMetadata({
        datasetName: "sample_customer_churn.csv",
        rows: SAMPLE_DATA.length,
        columns: Object.keys(SAMPLE_DATA[0]).length,
        uploadedAt: new Date().toISOString(),
      });
      store.setPipelineStatus("uploadComplete", true);
      store.setIsLanding(false);
      setLoadingSample(false);
      onUploadComplete();
    }, 500);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const workflowSteps = [
    { num: "01", title: "Upload", desc: "Drop your dataset" },
    { num: "02", title: "Profile", desc: "Auto-classify columns" },
    { num: "03", title: "Analyze", desc: "Generate insights" },
    { num: "04", title: "Model", desc: "Predictive analytics" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#FAFBFC",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          height: "64px",
          borderBottom: "1px solid #E2E8F0",
          background: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#1A2B3C",
            }}
          >
            AutoML
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <span style={{ fontSize: "12px", color: "#94A3B8" }}>
            No dataset loaded
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "#94A3B8",
              padding: "4px 8px",
              background: "#F1F5F9",
              borderRadius: "4px",
              fontWeight: 500,
            }}
          >
            v1.0
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: "72px 48px 56px",
          textAlign: "center",
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "42px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#0F172A",
              marginBottom: "16px",
              lineHeight: 1.1,
            }}
          >
            AutoML
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#64748B",
              lineHeight: "1.7",
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            Automatically clean, profile, analyze, and model your dataset 
            using statistically grounded heuristics. Upload once, gain comprehensive insights.
          </p>
        </div>
      </section>

      {/* Upload Area */}
      <section style={{ padding: "48px", background: "#FAFBFC", flex: 1 }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <div
            style={{
              padding: "48px 40px",
              background: "#FFFFFF",
              border: dragActive
                ? "2px solid #1A2B3C"
                : "1px solid #E2E8F0",
              borderRadius: "8px",
              transition: "all 0.2s ease",
              boxShadow: dragActive 
                ? "0 8px 24px rgba(26, 43, 60, 0.12), inset 0 0 0 1px #1A2B3C" 
                : "0 1px 3px rgba(0,0,0,0.04), inset 0 2px 4px rgba(0,0,0,0.02)",
              textAlign: "center",
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading || loadingSample ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    border: "2px solid #E2E8F0",
                    borderTopColor: "#1A2B3C",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <div
                  style={{
                    fontSize: "14px",
                    color: "#475569",
                    fontWeight: 600,
                  }}
                >
                  {loadingSample ? "Loading sample dataset..." : "Processing dataset..."}
                </div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Analyzing structure and validating data
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleChange}
                  style={{ display: "none" }}
                />
                {/* Upload Icon */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    margin: "0 auto 24px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                
                <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
                  Drag and drop your file here, or
                </div>
                
                <button
                  onClick={handleButtonClick}
                  style={{
                    padding: "12px 32px",
                    background: "#1A2B3C",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    transition: "all 0.15s ease",
                    boxShadow: "0 2px 4px rgba(26, 43, 60, 0.2)",
                    letterSpacing: "0.01em",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#0F1A24";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(26, 43, 60, 0.25)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#1A2B3C";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(26, 43, 60, 0.2)";
                  }}
                >
                  Select File
                </button>
                
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94A3B8",
                    marginBottom: "24px",
                  }}
                >
                  Supports CSV and Excel (.xlsx, .xls)
                </div>

                {/* Divider */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
                  <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>OR</span>
                  <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
                </div>

                {/* Sample Data Button */}
                <button
                  onClick={handleSampleData}
                  style={{
                    padding: "10px 24px",
                    background: "transparent",
                    color: "#475569",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    borderRadius: "6px",
                    transition: "all 0.15s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#CBD5E1";
                    e.currentTarget.style.background = "#F8FAFC";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#E2E8F0";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Try with sample dataset
                </button>
                
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94A3B8",
                    marginTop: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Your data never leaves your session
                </div>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#DC2626",
                fontSize: "13px",
                marginTop: "16px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>
      </section>

      {/* What Happens Next */}
      <section style={{ padding: "48px", background: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h3
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "#94A3B8",
              textTransform: "uppercase",
              marginBottom: "32px",
              textAlign: "center",
            }}
          >
            What Happens Next
          </h3>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            {workflowSteps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  textAlign: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#E2E8F0",
                    marginBottom: "12px",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1A2B3C",
                    marginBottom: "6px",
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748B",
                    lineHeight: "1.5",
                  }}
                >
                  {step.desc}
                </div>
                {idx < workflowSteps.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "18px",
                      right: "-12px",
                      width: "24px",
                      height: "1px",
                      background: "#E2E8F0",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "24px 48px",
          borderTop: "1px solid #E2E8F0",
          background: "#FAFBFC",
          fontSize: "12px",
          color: "#94A3B8",
          textAlign: "center",
        }}
      >
        <div style={{ fontWeight: 500, color: "#64748B", marginBottom: "4px" }}>
          AutoML — Automated Dataset Intelligence System
        </div>
        <div style={{ fontSize: "11px" }}>
          Production-grade analytics and machine learning pipeline
        </div>
      </footer>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;700&family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
}
