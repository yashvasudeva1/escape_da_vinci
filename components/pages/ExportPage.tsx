import PageContainer from "@/components/PageContainer";

const exportItems = [
  {
    title: "Cleaned Dataset",
    description: "Preprocessed CSV with all cleaning operations applied",
    filename: "customer_churn_data_cleaned.csv",
    size: "1.2 MB",
  },
  {
    title: "Full Analysis Report",
    description: "Comprehensive PDF report covering all six analytical tiers",
    filename: "automl_analysis_report.pdf",
    size: "3.8 MB",
  },
  {
    title: "Statistical Summary",
    description: "JSON file with descriptive statistics and metadata",
    filename: "statistical_summary.json",
    size: "124 KB",
  },
  {
    title: "Correlation Matrix",
    description: "CSV export of Pearson correlation coefficients",
    filename: "correlation_matrix.csv",
    size: "8 KB",
  },
  {
    title: "Feature Importance",
    description: "CSV with feature importance scores from baseline model",
    filename: "feature_importance.csv",
    size: "2 KB",
  },
  {
    title: "Visualizations Bundle",
    description: "ZIP archive containing all generated plots (PNG format)",
    filename: "visualizations.zip",
    size: "2.4 MB",
  },
  {
    title: "Model Artifacts",
    description: "Trained model file (pickle) with preprocessing pipeline",
    filename: "baseline_model.pkl",
    size: "890 KB",
  },
  {
    title: "Prescriptive Recommendations",
    description: "Markdown file with actionable insights and suggestions",
    filename: "prescriptive_recommendations.md",
    size: "18 KB",
  },
];

export default function ExportPage() {
  return (
    <PageContainer
      title="Export & Reports"
      subtitle="Download analysis outputs, reports, and model artifacts"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
        }}
      >
        {exportItems.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: "24px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
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
                {item.filename} · {item.size}
              </div>
              <button
                style={{
                  padding: "8px 16px",
                  background: "var(--color-navy)",
                  color: "white",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Download
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
            Complete Analysis Package
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            All outputs bundled in a single archive ·
            automl_complete_package.zip · 8.2 MB
          </div>
        </div>
        <button
          style={{
            padding: "12px 24px",
            background: "var(--color-navy)",
            color: "white",
            border: "none",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Download All
        </button>
      </div>
    </PageContainer>
  );
}
