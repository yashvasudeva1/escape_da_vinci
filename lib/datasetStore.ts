import { create } from "zustand";
import type { DatasetState } from "./types";

interface DatasetStore extends DatasetState {
  setRawData: (data: any[]) => void;
  setCleanedData: (data: any[]) => void;
  setMetadata: (metadata: Partial<DatasetState["metadata"]>) => void;
  setColumnProfile: (profile: DatasetState["columnProfile"]) => void;
  addCleaningAction: (action: DatasetState["cleaningLog"][0]) => void;
  setDescriptiveStats: (stats: DatasetState["descriptiveStats"]) => void;
  setDiagnosticStats: (stats: DatasetState["diagnosticStats"]) => void;
  setPredictiveResults: (results: DatasetState["predictiveResults"]) => void;
  setPrescriptiveInsights: (
    insights: DatasetState["prescriptiveInsights"]
  ) => void;
  reset: () => void;
}

const initialState: DatasetState = {
  rawData: [],
  cleanedData: [],
  metadata: {
    datasetName: "",
    rows: 0,
    columns: 0,
    memoryMB: 0,
    uploadedAt: "",
  },
  columnProfile: [],
  cleaningLog: [],
  descriptiveStats: {
    numeric: [],
    categorical: [],
  },
  diagnosticStats: {
    correlations: [],
    multicollinearity: [],
    pearsonMatrix: [],
  },
  predictiveResults: null,
  prescriptiveInsights: {
    featureEngineering: [],
    dataQualityRisks: [],
    businessLevers: [],
    modelImprovements: [],
  },
};

export const useDatasetStore = create<DatasetStore>((set) => ({
  ...initialState,

  setRawData: (data) => set({ rawData: data }),

  setCleanedData: (data) => set({ cleanedData: data }),

  setMetadata: (metadata) =>
    set((state) => ({
      metadata: { ...state.metadata, ...metadata },
    })),

  setColumnProfile: (profile) => set({ columnProfile: profile }),

  addCleaningAction: (action) =>
    set((state) => ({
      cleaningLog: [...state.cleaningLog, action],
    })),

  setDescriptiveStats: (stats) => set({ descriptiveStats: stats }),

  setDiagnosticStats: (stats) => set({ diagnosticStats: stats }),

  setPredictiveResults: (results) => set({ predictiveResults: results }),

  setPrescriptiveInsights: (insights) =>
    set({ prescriptiveInsights: insights }),

  reset: () => set(initialState),
}));
