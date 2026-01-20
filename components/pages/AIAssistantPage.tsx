"use client";

import { useState, useMemo } from "react";
import PageContainer from "@/components/PageContainer";
import { useDatasetStore } from "@/lib/datasetStore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistantPage() {
  const store = useDatasetStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I can help you understand your dataset analysis. Ask me about specific features, correlations, model performance, or business insights based on the analysis results.",
    },
  ]);
  const [input, setInput] = useState("");

  // Generate context-aware suggested questions based on available data
  const suggestedQuestions = useMemo(() => {
    const questions: string[] = [];

    if (store.predictiveResults) {
      questions.push(
        `What are the top predictors of ${store.predictiveResults.targetColumn}?`
      );
      questions.push("How well does the baseline model perform?");
    }

    if (store.diagnosticStats.correlations.length > 0) {
      questions.push("Which features are most strongly correlated?");
    }

    if (store.cleaningLog.length > 0) {
      questions.push("What data quality issues were detected?");
    }

    if (store.descriptiveStats.numeric.length > 0) {
      questions.push("Summarize the numeric feature distributions");
    }

    if (store.prescriptiveInsights.businessLevers.length > 0) {
      questions.push("What are the key business recommendations?");
    }

    // Default questions if no data
    if (questions.length === 0) {
      questions.push("What data has been uploaded?");
      questions.push("What analysis steps have been completed?");
    }

    return questions.slice(0, 5);
  }, [store]);

  // Generate response based on the question and available data
  const generateResponse = (question: string): string => {
    const q = question.toLowerCase();

    // Top predictors
    if (q.includes("predictor") || q.includes("feature importance") || q.includes("top feature")) {
      if (!store.predictiveResults?.featureImportance) {
        return "No predictive model has been trained yet. Please complete the analysis pipeline first.";
      }
      const top3 = store.predictiveResults.featureImportance.slice(0, 3);
      const total = top3.reduce((sum, f) => sum + f.importance, 0);
      return `Based on the baseline model, the top predictors of ${store.predictiveResults.targetColumn} are:\n\n` +
        top3.map((f, i) => `${i + 1}. **${f.feature}** (importance: ${f.importance.toFixed(3)})`).join("\n") +
        `\n\nThese features collectively account for ${(total * 100).toFixed(0)}% of predictive power.`;
    }

    // Model performance
    if (q.includes("model") && (q.includes("perform") || q.includes("accuracy") || q.includes("metric"))) {
      if (!store.predictiveResults?.metrics) {
        return "No predictive model has been trained yet. Please run the analysis pipeline.";
      }
      const metrics = store.predictiveResults.metrics;
      const metricLines = Object.entries(metrics)
        .map(([key, value]) => {
          const displayValue = key.includes("accuracy") || key.includes("precision") || 
                               key.includes("recall") || key.includes("f1") || key.includes("score")
            ? `${(value * 100).toFixed(1)}%`
            : value.toFixed(3);
          return `- **${key.replace(/_/g, " ")}**: ${displayValue}`;
        })
        .join("\n");
      return `The baseline ${store.predictiveResults.modelType} model performance:\n\n${metricLines}`;
    }

    // Correlations
    if (q.includes("correlat")) {
      if (store.diagnosticStats.correlations.length === 0) {
        return "No correlation analysis available. Please complete the diagnostic analytics step.";
      }
      const strongCorrs = store.diagnosticStats.correlations
        .filter(c => Math.abs(c.pearson) >= 0.5)
        .slice(0, 5);
      if (strongCorrs.length === 0) {
        return "No strong correlations (|r| >= 0.5) were found between numeric features.";
      }
      return "Strong correlations detected:\n\n" +
        strongCorrs.map(c => `- **${c.pair}**: Pearson r = ${c.pearson.toFixed(2)} (${c.interpretation})`).join("\n");
    }

    // Data quality
    if (q.includes("quality") || q.includes("cleaning") || q.includes("issue")) {
      if (store.cleaningLog.length === 0) {
        return "No data quality issues were detected or the dataset hasn't been cleaned yet.";
      }
      const summary = store.cleaningLog.slice(0, 5).map(log => 
        `- **${log.action.replace(/_/g, " ")}**: ${log.reason}`
      ).join("\n");
      return `Data quality operations performed:\n\n${summary}` +
        (store.cleaningLog.length > 5 ? `\n\n...and ${store.cleaningLog.length - 5} more operations.` : "");
    }

    // Numeric distributions
    if (q.includes("numeric") || q.includes("distribution") || q.includes("statistic")) {
      if (store.descriptiveStats.numeric.length === 0) {
        return "No numeric statistics available. Please complete the descriptive analytics step.";
      }
      const stats = store.descriptiveStats.numeric.slice(0, 5);
      return "Numeric feature summary:\n\n" +
        stats.map(s => 
          `**${s.column}**: mean=${s.mean.toFixed(2)}, std=${s.std.toFixed(2)}, range=[${s.min.toFixed(2)}, ${s.max.toFixed(2)}]`
        ).join("\n");
    }

    // Business recommendations
    if (q.includes("business") || q.includes("recommend") || q.includes("lever")) {
      if (store.prescriptiveInsights.businessLevers.length === 0) {
        return "No business recommendations available. Please complete the prescriptive analytics step.";
      }
      return "Key business recommendations:\n\n" +
        store.prescriptiveInsights.businessLevers.slice(0, 3).map(b => 
          `- **${b.lever}**: ${b.description} (Actionability: ${b.actionability})`
        ).join("\n");
    }

    // Data uploaded / status
    if (q.includes("upload") || q.includes("data") || q.includes("status") || q.includes("complete")) {
      if (store.rawData.length === 0) {
        return "No dataset has been uploaded yet. Please upload a CSV or Excel file to begin analysis.";
      }
      const status = store.pipelineStatus;
      const completedSteps = [
        status.cleaningComplete ? "Data Cleaning" : null,
        status.columnTypesComplete ? "Column Intelligence" : null,
        status.descriptiveComplete ? "Descriptive Analytics" : null,
        status.diagnosticComplete ? "Diagnostic Analytics" : null,
        status.predictiveComplete ? "Predictive Analytics" : null,
        status.prescriptiveComplete ? "Prescriptive Analytics" : null,
      ].filter(Boolean);

      return `Dataset: **${store.metadata.datasetName}**\n` +
        `Size: ${store.metadata.rows.toLocaleString()} rows × ${store.metadata.columns} columns\n\n` +
        `Completed analysis steps:\n` +
        (completedSteps.length > 0 
          ? completedSteps.map(s => `- ${s}`).join("\n")
          : "- No analysis steps completed yet");
    }

    // Default response
    return "I can help you understand your dataset analysis. Try asking about:\n\n" +
      "- Top predictors and feature importance\n" +
      "- Model performance metrics\n" +
      "- Feature correlations\n" +
      "- Data quality issues\n" +
      "- Business recommendations\n" +
      "- Analysis status";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const response = generateResponse(input);
    const assistantMessage: Message = { role: "assistant", content: response };

    setMessages([...messages, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <PageContainer
      title="AI Assistant"
      subtitle="Context-aware analysis assistant with dataset insights"
    >
      {/* Suggested Questions */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          Suggested Questions
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setInput(q)}
              style={{
                padding: "8px 12px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-standard)",
                fontSize: "12px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--color-navy)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border-standard)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div
        style={{
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)",
          display: "flex",
          flexDirection: "column",
          height: "600px",
        }}
      >
        {/* Messages */}
        <div
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {msg.role === "user" ? "You" : "Assistant"}
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  background:
                    msg.role === "user"
                      ? "var(--color-navy)"
                      : "var(--bg-tertiary)",
                  color:
                    msg.role === "user" ? "white" : "var(--text-secondary)",
                  maxWidth: "75%",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  border:
                    msg.role === "assistant"
                      ? "1px solid var(--border-subtle)"
                      : "none",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            padding: "16px 24px",
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your dataset analysis..."
            style={{
              flex: 1,
              padding: "10px 16px",
              border: "1px solid var(--border-standard)",
              background: "var(--bg-primary)",
              fontSize: "13px",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            style={{
              padding: "10px 24px",
              background: "var(--color-navy)",
              color: "white",
              border: "none",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
