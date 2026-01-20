import type {
  FeatureEngineeringSuggestion,
  DataQualityRisk,
  BusinessLever,
  ColumnProfile,
  PredictiveResults,
} from "./types";

export interface PrescriptiveResult {
  featureEngineering: FeatureEngineeringSuggestion[];
  dataQualityRisks: DataQualityRisk[];
  businessLevers: BusinessLever[];
  modelImprovements: string[];
  optimizationOpportunities: string[];
}

/**
 * Generate prescriptive recommendations
 */
export function generatePrescriptiveInsights(
  data: any[],
  columnProfile: ColumnProfile[],
  predictiveResults: PredictiveResults | null,
  correlations: any[]
): PrescriptiveResult {
  const featureEngineering = generateFeatureEngineeringSuggestions(
    columnProfile,
    correlations
  );

  const dataQualityRisks = assessDataQualityRisks(
    data,
    columnProfile,
    predictiveResults
  );

  const businessLevers = identifyBusinessLevers(
    columnProfile,
    predictiveResults,
    correlations
  );

  const modelImprovements = generateModelImprovements(
    predictiveResults,
    columnProfile
  );

  const optimizationOpportunities = generateOptimizationOpportunities(
    predictiveResults,
    correlations
  );

  return {
    featureEngineering,
    dataQualityRisks,
    businessLevers,
    modelImprovements,
    optimizationOpportunities,
  };
}

/**
 * Generate feature engineering suggestions
 */
function generateFeatureEngineeringSuggestions(
  columnProfile: ColumnProfile[],
  correlations: any[]
): FeatureEngineeringSuggestion[] {
  const suggestions: FeatureEngineeringSuggestion[] = [];

  // Polynomial features for continuous variables
  const continuousColumns = columnProfile.filter(
    (col) => col.detectedType === "continuous"
  );
  if (continuousColumns.length > 0) {
    const topContinuous = continuousColumns.slice(0, 3);
    topContinuous.forEach((col) => {
      suggestions.push({
        suggestion: `${col.column}_squared`,
        rationale: `Capture non-linear effects of ${col.column} using polynomial transformation`,
        impact: "high",
        complexity: "low",
      });
    });
  }

  // Ratio features
  const numericColumns = columnProfile.filter(
    (col) =>
      col.detectedType === "continuous" || col.detectedType === "discrete"
  );

  if (numericColumns.length >= 2) {
    suggestions.push({
      suggestion: `${numericColumns[0].column}_per_${numericColumns[1].column}`,
      rationale: `Ratio feature to normalize ${numericColumns[0].column} by ${numericColumns[1].column}`,
      impact: "medium",
      complexity: "low",
    });
  }

  // Interaction terms for correlated features
  if (correlations.length > 0) {
    const topCorr = correlations[0];
    if (topCorr && topCorr.pair) {
      const [feat1, feat2] = topCorr.pair.split(" ↔ ");
      suggestions.push({
        suggestion: `${feat1}_x_${feat2}`,
        rationale: `Interaction term between correlated features to capture combined effects`,
        impact: "medium",
        complexity: "medium",
      });
    }
  }

  // Binning for high-cardinality categoricals
  const highCardinalityCat = columnProfile.filter(
    (col) => col.detectedType === "categorical" && col.uniqueValues > 10
  );

  if (highCardinalityCat.length > 0) {
    suggestions.push({
      suggestion: `${highCardinalityCat[0].column}_binned`,
      rationale: `Group low-frequency categories to reduce noise and improve generalization`,
      impact: "medium",
      complexity: "low",
    });
  }

  return suggestions.slice(0, 5);
}

/**
 * Assess data quality risks
 */
function assessDataQualityRisks(
  data: any[],
  columnProfile: ColumnProfile[],
  predictiveResults: PredictiveResults | null
): DataQualityRisk[] {
  const risks: DataQualityRisk[] = [];

  // Check for class imbalance
  if (predictiveResults?.targetType === "classification") {
    const targetColumn = predictiveResults.targetColumn;
    const targetValues = data.map((row) => row[targetColumn]);
    const counts = new Map<any, number>();
    targetValues.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));

    const classCounts = Array.from(counts.values());
    const maxCount = Math.max(...classCounts);
    const minCount = Math.min(...classCounts);
    const imbalanceRatio = maxCount / minCount;

    if (imbalanceRatio > 2) {
      risks.push({
        risk: "Class imbalance",
        description: `Target classes are imbalanced (ratio: ${imbalanceRatio.toFixed(
          1
        )}:1)`,
        severity: imbalanceRatio > 5 ? "high" : "medium",
        mitigation:
          "Apply SMOTE oversampling, class weights, or stratified sampling",
      });
    }
  }

  // Check for high missing values
  const highMissing = columnProfile.filter((col) => col.missingPct > 5);
  if (highMissing.length > 0) {
    risks.push({
      risk: "High missing values",
      description: `${highMissing.length} columns have >5% missing data`,
      severity: "medium",
      mitigation:
        "Consider advanced imputation (KNN, iterative) or feature removal",
    });
  }

  // Check for low cardinality features
  const lowCardinality = columnProfile.filter(
    (col) => col.detectedType === "categorical" && col.uniqueValues <= 3
  );

  if (lowCardinality.length > 5) {
    risks.push({
      risk: "Many low-cardinality features",
      description: `${lowCardinality.length} categorical features have ≤3 unique values`,
      severity: "low",
      mitigation:
        "Consider one-hot encoding or target encoding for better representation",
    });
  }

  // Check for high-cardinality categoricals
  const veryHighCardinality = columnProfile.filter(
    (col) => col.detectedType === "categorical" && col.uniqueValues > 50
  );

  if (veryHighCardinality.length > 0) {
    risks.push({
      risk: "High-cardinality categorical features",
      description: `${veryHighCardinality.length} categorical features have >50 unique values`,
      severity: "medium",
      mitigation:
        "Apply frequency encoding, target encoding, or group rare categories",
    });
  }

  return risks;
}

/**
 * Identify business levers
 */
function identifyBusinessLevers(
  columnProfile: ColumnProfile[],
  predictiveResults: PredictiveResults | null,
  correlations: any[]
): BusinessLever[] {
  const levers: BusinessLever[] = [];

  if (!predictiveResults || predictiveResults.featureImportance.length === 0) {
    return levers;
  }

  // Top feature importance = key business lever
  const topFeatures = predictiveResults.featureImportance.slice(0, 3);

  topFeatures.forEach((feat, idx) => {
    const importance = (feat.importance * 100).toFixed(1);
    levers.push({
      lever: feat.feature,
      description: `Top ${
        idx + 1
      } predictor with ${importance}% importance - optimize this variable for maximum impact`,
      actionability: "high",
    });
  });

  // Strong correlations = indirect levers
  if (correlations.length > 0) {
    const strongCorr = correlations.filter((c) => Math.abs(c.pearson) > 0.6);
    if (strongCorr.length > 0) {
      levers.push({
        lever: "Correlated feature groups",
        description: `${strongCorr.length} feature pairs show strong correlation - changes propagate across related variables`,
        actionability: "medium",
      });
    }
  }

  return levers;
}

/**
 * Generate model improvement actions
 */
function generateModelImprovements(
  predictiveResults: PredictiveResults | null,
  columnProfile: ColumnProfile[]
): string[] {
  const improvements: string[] = [];

  if (!predictiveResults) {
    improvements.push(
      "No target detected - consider defining prediction objective"
    );
    return improvements;
  }

  if (predictiveResults.targetType === "classification") {
    const accuracy = predictiveResults.metrics.accuracy || 0;
    if (accuracy < 0.85) {
      improvements.push(
        "Baseline accuracy <85% - apply hyperparameter tuning (max_depth, n_estimators, min_samples_split)"
      );
    }

    const recall = predictiveResults.metrics.recall || 0;
    if (recall < 0.7) {
      improvements.push(
        "Low recall detected - consider class weights, threshold tuning, or ensemble methods"
      );
    }

    improvements.push(
      "Test alternative algorithms: XGBoost, LightGBM, CatBoost for potential performance gains"
    );
  }

  if (predictiveResults.targetType === "regression") {
    improvements.push(
      "Apply cross-validation (k-fold) to ensure robust performance estimates"
    );
  }

  improvements.push(
    "Implement feature selection (RFE, LASSO) to reduce dimensionality and improve interpretability"
  );
  improvements.push(
    "Generate SHAP values for model explainability and feature interaction analysis"
  );

  return improvements.slice(0, 5);
}

/**
 * Generate optimization opportunities
 */
function generateOptimizationOpportunities(
  predictiveResults: PredictiveResults | null,
  correlations: any[]
): string[] {
  const opportunities: string[] = [];

  if (correlations.length > 5) {
    opportunities.push(
      "Multiple strong correlations detected - consider PCA or feature selection to reduce redundancy"
    );
  }

  if (
    predictiveResults?.featuresUsed &&
    predictiveResults.featuresUsed.length > 20
  ) {
    opportunities.push(
      "High feature dimensionality - apply dimensionality reduction or feature importance thresholding"
    );
  }

  opportunities.push(
    "Implement automated hyperparameter optimization using Optuna or GridSearchCV"
  );
  opportunities.push(
    "Create ensemble models (stacking, blending) to combine multiple algorithms"
  );

  return opportunities.slice(0, 4);
}
