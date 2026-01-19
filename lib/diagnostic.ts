import type {
  CorrelationPair,
  MulticollinearityWarning,
  ColumnProfile,
} from "./types";
import {
  getNumericValues,
  computePearsonCorrelation,
  computeSpearmanCorrelation,
  computeKendallCorrelation,
  computeVIF,
} from "./utils";

export interface DiagnosticResult {
  correlations: CorrelationPair[];
  multicollinearity: MulticollinearityWarning[];
  pearsonMatrix: number[][];
}

/**
 * Compute diagnostic analytics
 */
export function computeDiagnosticStats(
  data: any[],
  columnProfile: ColumnProfile[]
): DiagnosticResult {
  const numericColumns = columnProfile
    .filter(
      (col) =>
        col.detectedType === "continuous" || col.detectedType === "discrete"
    )
    .map((col) => col.column);

  if (numericColumns.length < 2) {
    return {
      correlations: [],
      multicollinearity: [],
      pearsonMatrix: [],
    };
  }

  // Compute correlation matrix
  const pearsonMatrix = computeCorrelationMatrix(data, numericColumns);

  // Find strong correlations
  const correlations = findStrongCorrelations(
    data,
    numericColumns,
    pearsonMatrix
  );

  // Detect multicollinearity
  const multicollinearity = detectMulticollinearity(
    numericColumns,
    pearsonMatrix
  );

  return {
    correlations,
    multicollinearity,
    pearsonMatrix,
  };
}

/**
 * Compute Pearson correlation matrix
 */
function computeCorrelationMatrix(data: any[], columns: string[]): number[][] {
  const matrix: number[][] = [];

  for (let i = 0; i < columns.length; i++) {
    matrix[i] = [];
    const valuesI = getNumericValues(data, columns[i]);

    for (let j = 0; j < columns.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        const valuesJ = getNumericValues(data, columns[j]);
        matrix[i][j] = computePearsonCorrelation(valuesI, valuesJ);
      }
    }
  }

  return matrix;
}

/**
 * Find strong correlation pairs
 */
function findStrongCorrelations(
  data: any[],
  columns: string[],
  pearsonMatrix: number[][]
): CorrelationPair[] {
  const pairs: CorrelationPair[] = [];

  for (let i = 0; i < columns.length; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      const pearson = pearsonMatrix[i][j];

      // Only include significant correlations
      if (Math.abs(pearson) >= 0.3) {
        const valuesI = getNumericValues(data, columns[i]);
        const valuesJ = getNumericValues(data, columns[j]);

        const spearman = computeSpearmanCorrelation(valuesI, valuesJ);
        const kendall = computeKendallCorrelation(valuesI, valuesJ);

        pairs.push({
          pair: `${columns[i]} ↔ ${columns[j]}`,
          pearson: Number(pearson.toFixed(2)),
          spearman: Number(spearman.toFixed(2)),
          kendall: Number(kendall.toFixed(2)),
          interpretation: interpretCorrelation(pearson, spearman),
        });
      }
    }
  }

  // Sort by absolute Pearson correlation
  pairs.sort((a, b) => Math.abs(b.pearson) - Math.abs(a.pearson));

  return pairs.slice(0, 20); // Top 20
}

/**
 * Interpret correlation strength
 */
function interpretCorrelation(pearson: number, spearman: number): string {
  const absPearson = Math.abs(pearson);
  const absSpearman = Math.abs(spearman);
  const direction = pearson > 0 ? "positive" : "negative";

  let strength = "";
  if (absPearson >= 0.7) strength = "Strong";
  else if (absPearson >= 0.5) strength = "Moderate";
  else if (absPearson >= 0.3) strength = "Weak";
  else strength = "Very weak";

  const relationship =
    Math.abs(absSpearman - absPearson) > 0.2 ? "monotonic" : "linear";

  return `${strength} ${direction} ${relationship} relationship`;
}

/**
 * Detect multicollinearity using VIF
 */
function detectMulticollinearity(
  columns: string[],
  correlationMatrix: number[][]
): MulticollinearityWarning[] {
  return columns.map((column, index) => {
    const vif = computeVIF(correlationMatrix, index);

    let status: "acceptable" | "moderate" | "high";
    if (vif < 5) status = "acceptable";
    else if (vif < 10) status = "moderate";
    else status = "high";

    return {
      feature: column,
      vif: Number(vif.toFixed(2)),
      status,
    };
  });
}
