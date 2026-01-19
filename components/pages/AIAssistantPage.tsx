"use client";

import { useState } from "react";
import PageContainer from "@/components/PageContainer";

const suggestedQuestions = [
  "What are the top three predictors of customer churn?",
  "Which customer segments have the highest churn risk?",
  "How does contract type affect churn probability?",
  "What is the correlation between tenure and total charges?",
  "Summarize the data quality issues detected",
];

const mockMessages = [
  {
    role: "assistant",
    content:
      "I can help you understand your dataset analysis. Ask me about specific features, correlations, model performance, or business insights.",
  },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([
      ...messages,
      { role: "user", content: input },
      {
        role: "assistant",
        content:
          "Analysis shows tenure is the strongest predictor of churn (importance: 0.28), followed by monthly_charges (0.22) and total_charges (0.19). These features collectively account for 69% of predictive power in the baseline Random Forest model. Source: Tier 5 Predictive Analytics.",
      },
    ]);
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
