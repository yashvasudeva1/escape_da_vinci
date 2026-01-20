import { create } from "zustand";
import type { DatasetState } from "./types";

// Loading states for each pipeline tier
export interface LoadingStates {
  upload: boolean;
  cleaning: boolean;
  columnTypes: boolean;
  descriptive: boolean;
  diagnostic: boolean;
  predictive: boolean;
  prescriptive: boolean;
  export: boolean;
}

// Error states for each pipeline tier
export interface ErrorStates {
  upload: string | null;
  cleaning: string | null;
  columnTypes: string | null;
  descriptive: string | null;
  diagnostic: string | null;
  predictive: string | null;
  prescriptive: string | null;
  export: string | null;
}

// Pipeline completion states
export interface PipelineStatus {
  uploadComplete: boolean;
  cleaningComplete: boolean;
  columnTypesComplete: boolean;
  descriptiveComplete: boolean;
  diagnosticComplete: boolean;
  predictiveComplete: boolean;
  prescriptiveComplete: boolean;
}

interface DatasetStore extends DatasetState {
  // Loading states
  loading: LoadingStates;
  // Error states
  errors: ErrorStates;
  // Pipeline status
  pipelineStatus: PipelineStatus;
  // Last analyzed timestamp
  lastAnalyzedAt: string | null;
  // Is landing page (no data uploaded yet)
  isLanding: boolean;

  // Setters
  setRawData: (data: any[]) => void;
  setCleanedData: (data: any[]) => void;
  setMetadata: (metadata: Partial<DatasetState["metadata"]>) => void;
  setColumnProfile: (profile: DatasetState["columnProfile"]) => void;
  addCleaningAction: (action: DatasetState["cleaningLog"][0]) => void;
  setCleaningLog: (log: DatasetState["cleaningLog"]) => void;
  setDescriptiveStats: (stats: DatasetState["descriptiveStats"]) => void;
  setDiagnosticStats: (stats: DatasetState["diagnosticStats"]) => void;
  setPredictiveResults: (results: DatasetState["predictiveResults"]) => void;
  setPrescriptiveInsights: (insights: DatasetState["prescriptiveInsights"]) => void;
  
  // Loading state setters
  setLoading: (key: keyof LoadingStates, value: boolean) => void;
  setError: (key: keyof ErrorStates, value: string | null) => void;
  setPipelineStatus: (key: keyof PipelineStatus, value: boolean) => void;
  setLastAnalyzedAt: (timestamp: string) => void;
  setIsLanding: (value: boolean) => void;
  
  // Utility
  reset: () => void;
  getCompletedTiers: () => number;
}

const initialLoadingState: LoadingStates = {
  upload: false,
  cleaning: false,
  columnTypes: false,
  descriptive: false,
  diagnostic: false,
  predictive: false,
  prescriptive: false,
  export: false,
};

const initialErrorState: ErrorStates = {
  upload: null,
  cleaning: null,
  columnTypes: null,
  descriptive: null,
  diagnostic: null,
  predictive: null,
  prescriptive: null,
  export: null,
};

const initialPipelineStatus: PipelineStatus = {
  uploadComplete: false,
  cleaningComplete: false,
  columnTypesComplete: false,
  descriptiveComplete: false,
  diagnosticComplete: false,
  predictiveComplete: false,
  prescriptiveComplete: false,
};

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

export const useDatasetStore = create<DatasetStore>((set, get) => ({
  ...initialState,
  loading: initialLoadingState,
  errors: initialErrorState,
  pipelineStatus: initialPipelineStatus,
  lastAnalyzedAt: null,
  isLanding: true,

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

  setCleaningLog: (log) => set({ cleaningLog: log }),

  setDescriptiveStats: (stats) => set({ descriptiveStats: stats }),

  setDiagnosticStats: (stats) => set({ diagnosticStats: stats }),

  setPredictiveResults: (results) => set({ predictiveResults: results }),

  setPrescriptiveInsights: (insights) =>
    set({ prescriptiveInsights: insights }),

  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),

  setError: (key, value) =>
    set((state) => ({
      errors: { ...state.errors, [key]: value },
    })),

  setPipelineStatus: (key, value) =>
    set((state) => ({
      pipelineStatus: { ...state.pipelineStatus, [key]: value },
    })),

  setLastAnalyzedAt: (timestamp) => set({ lastAnalyzedAt: timestamp }),

  setIsLanding: (value) => set({ isLanding: value }),

  getCompletedTiers: () => {
    const status = get().pipelineStatus;
    let count = 0;
    if (status.cleaningComplete) count++;
    if (status.columnTypesComplete) count++;
    if (status.descriptiveComplete) count++;
    if (status.diagnosticComplete) count++;
    if (status.predictiveComplete) count++;
    if (status.prescriptiveComplete) count++;
    return count;
  },

  reset: () =>
    set({
      ...initialState,
      loading: initialLoadingState,
      errors: initialErrorState,
      pipelineStatus: initialPipelineStatus,
      lastAnalyzedAt: null,
      isLanding: true,
    }),
}));
