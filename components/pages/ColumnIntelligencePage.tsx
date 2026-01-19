import PageContainer from "@/components/PageContainer";
import DataTable from "@/components/DataTable";

const columnData = [
  {
    column: "tenure",
    type: "Continuous Numeric",
    reasoning: "Wide range, high cardinality, no natural grouping",
    unique: 73,
    missing: "0%",
  },
  {
    column: "monthly_charges",
    type: "Continuous Numeric",
    reasoning: "Decimal values, continuous distribution",
    unique: 1585,
    missing: "0%",
  },
  {
    column: "total_charges",
    type: "Continuous Numeric",
    reasoning: "High precision numeric, cumulative measure",
    unique: 6531,
    missing: "0.16%",
  },
  {
    column: "gender",
    type: "Categorical",
    reasoning: "Low cardinality, distinct groups",
    unique: 2,
    missing: "0%",
  },
  {
    column: "senior_citizen",
    type: "Discrete Numeric",
    reasoning: "Binary numeric indicator (0/1)",
    unique: 2,
    missing: "0%",
  },
  {
    column: "partner",
    type: "Categorical",
    reasoning: "Yes/No categorical",
    unique: 2,
    missing: "0%",
  },
  {
    column: "dependents",
    type: "Categorical",
    reasoning: "Yes/No categorical",
    unique: 2,
    missing: "0%",
  },
  {
    column: "phone_service",
    type: "Categorical",
    reasoning: "Yes/No categorical",
    unique: 2,
    missing: "0%",
  },
  {
    column: "multiple_lines",
    type: "Categorical",
    reasoning: "Nominal groups (Yes/No/No phone service)",
    unique: 3,
    missing: "0%",
  },
  {
    column: "internet_service",
    type: "Categorical",
    reasoning: "Service type grouping",
    unique: 3,
    missing: "0%",
  },
  {
    column: "online_security",
    type: "Categorical",
    reasoning: "Service feature indicator",
    unique: 3,
    missing: "0%",
  },
  {
    column: "contract",
    type: "Categorical",
    reasoning: "Contract type grouping",
    unique: 3,
    missing: "0%",
  },
  {
    column: "payment_method",
    type: "Categorical",
    reasoning: "Payment type grouping",
    unique: 4,
    missing: "0.1%",
  },
  {
    column: "paperless_billing",
    type: "Categorical",
    reasoning: "Yes/No categorical",
    unique: 2,
    missing: "0%",
  },
  {
    column: "churn",
    type: "Categorical",
    reasoning: "Binary target variable (Yes/No)",
    unique: 2,
    missing: "0%",
  },
];

const columns = [
  { key: "column", label: "Column", sortable: true, width: "18%" },
  { key: "type", label: "Detected Type", sortable: true, width: "18%" },
  { key: "reasoning", label: "Reasoning", sortable: false, width: "40%" },
  { key: "unique", label: "Unique Values", sortable: true, width: "12%" },
  { key: "missing", label: "Missing %", sortable: true, width: "12%" },
];

export default function ColumnIntelligencePage() {
  return (
    <PageContainer
      title="Column Intelligence"
      subtitle="TIER 2 — Semantic column type classification and metadata analysis"
    >
      {/* Type Distribution */}
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
            Continuous Numeric
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            3 columns
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
            Discrete Numeric
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            1 column
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
            Categorical
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            11 columns
          </div>
        </div>
      </div>

      {/* Column Table */}
      <div style={{ marginBottom: "32px" }}>
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
            Column Analysis
          </h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border-standard)",
                background: "var(--bg-secondary)",
                fontSize: "13px",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <option>All Types</option>
              <option>Continuous Numeric</option>
              <option>Discrete Numeric</option>
              <option>Categorical</option>
            </select>
            <input
              type="text"
              placeholder="Search columns..."
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border-standard)",
                background: "var(--bg-secondary)",
                fontSize: "13px",
                color: "var(--text-secondary)",
                width: "200px",
              }}
            />
          </div>
        </div>
        <DataTable columns={columns} data={columnData} />
      </div>

      {/* Detection Methodology */}
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
          Detection Methodology
        </div>
        <p>
          Semantic type classification uses heuristic analysis independent of
          pandas dtype. Continuous numeric: high cardinality ratio (unique/total
          &gt; 0.05), decimal precision, no natural grouping. Discrete numeric:
          low cardinality, integer values, countable states. Categorical: named
          groups, low unique count, string or object dtype with semantic
          meaning.
        </p>
      </div>
    </PageContainer>
  );
}
