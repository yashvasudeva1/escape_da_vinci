"use client";

import { useMemo } from "react";
import PageContainer from "@/components/PageContainer";
import DataTable from "@/components/DataTable";
import { useDatasetStore } from "@/lib/datasetStore";

const feColumns = [
  { key: "suggestion", label: "Feature", sortable: true, width: "25%" },
  { key: "rationale", label: "Rationale", sortable: false, width: "45%" },
  { key: "impact", label: "Impact", sortable: true, width: "15%" },
  { key: "complexity", label: "Complexity", sortable: true, width: "15%" },
];

const riskColumns = [
  { key: "risk", label: "Risk", sortable: true, width: "20%" },
  { key: "description", label: "Description", sortable: false, width: "40%" },
  { key: "severity", label: "Severity", sortable: true, width: "15%" },
  { key: "mitigation", label: "Mitigation", sortable: false, width: "25%" },
];

const leverColumns = [
  { key: "lever", label: "Business Lever", sortable: true, width: "25%" },
  { key: "description", label: "Finding", sortable: false, width: "55%" },
  {
    key: "actionability",
    label: "Actionability",
    sortable: true,
    width: "20%",
  },
];

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function PrescriptiveAnalyticsPage() {
  const store = useDatasetStore();
  const { prescriptiveInsights, loading, errors } = store;
  const isLoading = loading.prescriptive;
  const error = errors.prescriptive;

  // Transform feature engineering suggestions
  const featureEngineering = useMemo(() => {
    return prescriptiveInsights.featureEngineering.map((item) => ({
      suggestion: item.suggestion,
      rationale: item.rationale,
      impact: capitalizeFirst(item.impact),
      complexity: capitalizeFirst(item.complexity),
    }));
  }, [prescriptiveInsights.featureEngineering]);

  // Transform data quality risks
  const dataQualityRisks = useMemo(() => {
    return prescriptiveInsights.dataQualityRisks.map((item) => ({
      risk: item.risk,
      description: item.description,
      severity: capitalizeFirst(item.severity),
      mitigation: item.mitigation,
    }));
  }, [prescriptiveInsights.dataQualityRisks]);

  // Transform business levers
  const businessLevers = useMemo(() => {
    return prescriptiveInsights.businessLevers.map((item) => ({
      lever: item.lever,
      description: item.description,
      actionability: capitalizeFirst(item.actionability),
    }));
  }, [prescriptiveInsights.businessLevers]);

  // Get model improvement actions
  const modelImprovements = prescriptiveInsights.modelImprovements || [];

  const hasData =
    featureEngineering.length > 0 ||
    dataQualityRisks.length > 0 ||
    businessLevers.length > 0 ||
    modelImprovements.length > 0;

  // Empty state
  if (!isLoading && !hasData) {
    return (
      <PageContainer
        title="Prescriptive Analytics"
        subtitle="TIER 6 — Feature engineering, risk mitigation, and business recommendations"
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
          No prescriptive insights available. Complete the analysis pipeline first.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Prescriptive Analytics"
      subtitle="TIER 6 — Feature engineering, risk mitigation, and business recommendations"
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
          Generating prescriptive insights...
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

      {/* Feature Engineering */}
      {featureEngineering.length > 0 && (
        <div style={{ marginBottom: "48px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Feature Engineering Suggestions
          </h3>
          <DataTable columns={feColumns} data={featureEngineering} />
        </div>
      )}

      {/* Data Quality Risks */}
      {dataQualityRisks.length > 0 && (
        <div style={{ marginBottom: "48px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Data Quality Risks
          </h3>
          <DataTable columns={riskColumns} data={dataQualityRisks} />
        </div>
      )}

      {/* Business Levers */}
      {businessLevers.length > 0 && (
        <div style={{ marginBottom: "48px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Business Levers & Optimization Opportunities
          </h3>
          <DataTable columns={leverColumns} data={businessLevers} />
        </div>
      )}

      {/* Model Improvement Actions */}
      {modelImprovements.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Model Improvement Actions
          </h3>
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-tertiary)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Recommended Next Steps
            </div>
            <div style={{ padding: "20px 24px" }}>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {modelImprovements.map((improvement, idx) => (
                  <li
                    key={idx}
                    style={{
                      paddingLeft: "24px",
                      position: "relative",
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      lineHeight: "1.6",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "6px",
                        width: "6px",
                        height: "6px",
                        background: "var(--color-navy)",
                        borderRadius: "50%",
                      }}
                    />
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
