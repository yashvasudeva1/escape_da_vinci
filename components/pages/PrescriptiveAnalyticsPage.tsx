import PageContainer from "@/components/PageContainer";
import DataTable from "@/components/DataTable";

const featureEngineering = [
  {
    suggestion: "tenure_squared",
    rationale: "Capture non-linear tenure effects on churn probability",
    impact: "High",
    complexity: "Low",
  },
  {
    suggestion: "charges_per_month",
    rationale:
      "Ratio feature: total_charges / tenure for normalized spend rate",
    impact: "Medium",
    complexity: "Low",
  },
  {
    suggestion: "contract_tenure_interaction",
    rationale: "Interaction between contract type and tenure duration",
    impact: "Medium",
    complexity: "Medium",
  },
  {
    suggestion: "service_bundle_count",
    rationale: "Count of active services (internet, phone, security)",
    impact: "Medium",
    complexity: "Low",
  },
];

const dataQualityRisks = [
  {
    risk: "Class imbalance",
    description: "Churn class represents ~26% of dataset",
    severity: "Medium",
    mitigation: "SMOTE oversampling or class weights",
  },
  {
    risk: "Feature redundancy",
    description: "total_charges correlates strongly with tenure",
    severity: "Low",
    mitigation: "Feature selection or PCA",
  },
  {
    risk: "Low cardinality",
    description: "11 categorical features with 2-4 unique values",
    severity: "Low",
    mitigation: "Target encoding or embeddings",
  },
];

const businessLevers = [
  {
    lever: "Contract retention",
    description:
      "Month-to-month contracts show 3.2× higher churn vs. long-term",
    actionability: "High",
  },
  {
    lever: "Service engagement",
    description: "Customers with multiple services have 42% lower churn",
    actionability: "High",
  },
  {
    lever: "Tenure milestones",
    description: "Churn risk decreases significantly after 12 months",
    actionability: "Medium",
  },
];

const columns1 = [
  { key: "suggestion", label: "Feature", sortable: true, width: "25%" },
  { key: "rationale", label: "Rationale", sortable: false, width: "45%" },
  { key: "impact", label: "Impact", sortable: true, width: "15%" },
  { key: "complexity", label: "Complexity", sortable: true, width: "15%" },
];

const columns2 = [
  { key: "risk", label: "Risk", sortable: true, width: "20%" },
  { key: "description", label: "Description", sortable: false, width: "40%" },
  { key: "severity", label: "Severity", sortable: true, width: "15%" },
  { key: "mitigation", label: "Mitigation", sortable: false, width: "25%" },
];

const columns3 = [
  { key: "lever", label: "Business Lever", sortable: true, width: "25%" },
  { key: "description", label: "Finding", sortable: false, width: "55%" },
  {
    key: "actionability",
    label: "Actionability",
    sortable: true,
    width: "20%",
  },
];

export default function PrescriptiveAnalyticsPage() {
  return (
    <PageContainer
      title="Prescriptive Analytics"
      subtitle="TIER 6 — Feature engineering, risk mitigation, and business recommendations"
    >
      {/* Feature Engineering */}
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
        <DataTable columns={columns1} data={featureEngineering} />
      </div>

      {/* Data Quality Risks */}
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
        <DataTable columns={columns2} data={dataQualityRisks} />
      </div>

      {/* Business Levers */}
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
        <DataTable columns={columns3} data={businessLevers} />
      </div>

      {/* Model Improvement Actions */}
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
              <li
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
                    top: "4px",
                    width: "6px",
                    height: "6px",
                    background: "var(--color-navy)",
                    borderRadius: "50%",
                  }}
                />
                <strong style={{ color: "var(--text-primary)" }}>
                  Address class imbalance:
                </strong>{" "}
                Apply SMOTE oversampling or adjust class weights to improve
                minority class recall
              </li>
              <li
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
                    top: "4px",
                    width: "6px",
                    height: "6px",
                    background: "var(--color-navy)",
                    borderRadius: "50%",
                  }}
                />
                <strong style={{ color: "var(--text-primary)" }}>
                  Feature engineering:
                </strong>{" "}
                Implement polynomial features for tenure and create interaction
                terms between contract type and service variables
              </li>
              <li
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
                    top: "4px",
                    width: "6px",
                    height: "6px",
                    background: "var(--color-navy)",
                    borderRadius: "50%",
                  }}
                />
                <strong style={{ color: "var(--text-primary)" }}>
                  Hyperparameter optimization:
                </strong>{" "}
                Conduct grid search on max_depth, min_samples_split, and
                n_estimators for Random Forest
              </li>
              <li
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
                    top: "4px",
                    width: "6px",
                    height: "6px",
                    background: "var(--color-navy)",
                    borderRadius: "50%",
                  }}
                />
                <strong style={{ color: "var(--text-primary)" }}>
                  Alternative algorithms:
                </strong>{" "}
                Test XGBoost and LightGBM for potential performance gains on
                imbalanced classification
              </li>
              <li
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
                    top: "4px",
                    width: "6px",
                    height: "6px",
                    background: "var(--color-navy)",
                    borderRadius: "50%",
                  }}
                />
                <strong style={{ color: "var(--text-primary)" }}>
                  Cross-validation:
                </strong>{" "}
                Implement stratified k-fold CV to ensure robust performance
                estimates across class distributions
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
