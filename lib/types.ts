export type ColumnType =
  | "continuous"
  | "discrete"
  | "categorical"
  | "datetime"
  | "unknown";

export interface ColumnProfile {
  column: string;
  detectedType: ColumnType;
  reasoning: string;
  uniqueValues: number;
  missingPct: number;
}

export interface CleaningAction {
  action: string;
  column?: string;
  reason: string;
  rowsAffected?: number;
}

export interface DatasetMetadata {
  datasetName: string;
  rows: number;
  columns: number;
  memoryMB: number;
  uploadedAt: string;
}

export interface NumericStats {
  column: string;
  mean: number;
  median: number;
  std: number;
  skewness: number;
  kurtosis: number;
  cv: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
}

export interface CategoricalStats {
  column: string;
  uniqueCount: number;
  entropy: number;
  topCategories: Array<{ value: string; count: number; percent: number }>;
  dominantCategory: string;
  dominantPct: number;
}

export interface CorrelationPair {
  pair: string;
  pearson: number;
  spearman: number;
  kendall: number;
  interpretation: string;
}

export interface MulticollinearityWarning {
  feature: string;
  vif: number;
  status: "acceptable" | "moderate" | "high";
}

export interface PredictiveResults {
  targetColumn: string;
  targetType: "classification" | "regression" | "clustering";
  featuresUsed: string[];
  modelType: string;
  metrics: Record<string, number>;
  featureImportance: Array<{ feature: string; importance: number }>;
  confusionMatrix?: number[][];
}

export interface FeatureEngineeringSuggestion {
  suggestion: string;
  rationale: string;
  impact: "high" | "medium" | "low";
  complexity: "high" | "medium" | "low";
}

export interface DataQualityRisk {
  risk: string;
  description: string;
  severity: "high" | "medium" | "low";
  mitigation: string;
}

export interface BusinessLever {
  lever: string;
  description: string;
  actionability: "high" | "medium" | "low";
}

export interface DatasetState {
  rawData: any[];
  cleanedData: any[];
  metadata: DatasetMetadata;
  columnProfile: ColumnProfile[];
  cleaningLog: CleaningAction[];
  descriptiveStats: {
    numeric: NumericStats[];
    categorical: CategoricalStats[];
  };
  diagnosticStats: {
    correlations: CorrelationPair[];
    multicollinearity: MulticollinearityWarning[];
    pearsonMatrix: number[][];
  };
  predictiveResults: PredictiveResults | null;
  prescriptiveInsights: {
    featureEngineering: FeatureEngineeringSuggestion[];
    dataQualityRisks: DataQualityRisk[];
    businessLevers: BusinessLever[];
    modelImprovements: string[];
  };
}
