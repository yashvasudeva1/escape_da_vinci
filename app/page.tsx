"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import LandingPage from "@/components/pages/LandingPage";
import OverviewPage from "@/components/pages/OverviewPage";
import IngestionPage from "@/components/pages/IngestionPage";
import ColumnIntelligencePage from "@/components/pages/ColumnIntelligencePage";
import DescriptiveAnalyticsPage from "@/components/pages/DescriptiveAnalyticsPage";
import DiagnosticAnalyticsPage from "@/components/pages/DiagnosticAnalyticsPage";
import PredictiveAnalyticsPage from "@/components/pages/PredictiveAnalyticsPage";
import PrescriptiveAnalyticsPage from "@/components/pages/PrescriptiveAnalyticsPage";
import ExportPage from "@/components/pages/ExportPage";
import AIAssistantPage from "@/components/pages/AIAssistantPage";
import { useDatasetStore } from "@/lib/datasetStore";

export default function Home() {
  const [activePage, setActivePage] = useState("overview");
  const store = useDatasetStore();
  const isLanding = store.isLanding;

  const handleUploadComplete = () => {
    // After upload, navigate to overview
    setActivePage("overview");
  };

  // Show landing page if no data has been uploaded
  if (isLanding) {
    return <LandingPage onUploadComplete={handleUploadComplete} />;
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header />
      <div style={{ display: "flex", flex: 1 }}>
        <Navigation activeItem={activePage} setActiveItem={setActivePage} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {activePage === "overview" && <OverviewPage />}
          {activePage === "ingestion" && <IngestionPage />}
          {activePage === "columns" && <ColumnIntelligencePage />}
          {activePage === "descriptive" && <DescriptiveAnalyticsPage />}
          {activePage === "diagnostic" && <DiagnosticAnalyticsPage />}
          {activePage === "predictive" && <PredictiveAnalyticsPage />}
          {activePage === "prescriptive" && <PrescriptiveAnalyticsPage />}
          {activePage === "export" && <ExportPage />}
          {activePage === "assistant" && <AIAssistantPage />}
        </main>
      </div>
    </div>
  );
}
