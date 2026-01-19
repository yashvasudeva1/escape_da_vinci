export default function PipelineProgress({
  currentTier,
}: {
  currentTier: number;
}) {
  const tiers = [
    { tier: 1, label: "Data Ingestion & Cleaning" },
    { tier: 2, label: "Column Intelligence" },
    { tier: 3, label: "Descriptive Analytics" },
    { tier: 4, label: "Diagnostic Analytics" },
    { tier: 5, label: "Predictive Analytics" },
    { tier: 6, label: "Prescriptive Analytics" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        Pipeline Progress
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        {tiers.map((tier, idx) => (
          <div
            key={tier.tier}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background:
                      tier.tier <= currentTier
                        ? "var(--color-navy)"
                        : "var(--border-standard)",
                    color:
                      tier.tier <= currentTier
                        ? "white"
                        : "var(--text-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {tier.tier}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color:
                      tier.tier <= currentTier
                        ? "var(--text-primary)"
                        : "var(--text-tertiary)",
                    fontWeight: tier.tier <= currentTier ? 500 : 400,
                  }}
                >
                  {tier.label}
                </div>
              </div>
            </div>
            {idx < tiers.length - 1 && (
              <div
                style={{
                  width: "24px",
                  height: "2px",
                  background:
                    tier.tier < currentTier
                      ? "var(--color-navy)"
                      : "var(--border-standard)",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
