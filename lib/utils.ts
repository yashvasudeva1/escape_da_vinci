import * as ss from "simple-statistics";

/**
 * Compute entropy of a categorical distribution
 */
export function computeEntropy(values: any[]): number {
  const counts = new Map<any, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));

  const total = values.length;
  let entropy = 0;

  counts.forEach((count) => {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  });

  return entropy;
}

/**
 * Compute skewness (Fisher-Pearson coefficient)
 */
export function computeSkewness(values: number[]): number {
  if (values.length < 3) return 0;

  const mean = ss.mean(values);
  const std = ss.standardDeviation(values);

  if (std === 0) return 0;

  const n = values.length;
  const m3 =
    values.reduce((sum, x) => sum + Math.pow((x - mean) / std, 3), 0) / n;

  return m3;
}

/**
 * Compute kurtosis (excess kurtosis)
 */
export function computeKurtosis(values: number[]): number {
  if (values.length < 4) return 0;

  const mean = ss.mean(values);
  const std = ss.standardDeviation(values);

  if (std === 0) return 0;

  const n = values.length;
  const m4 =
    values.reduce((sum, x) => sum + Math.pow((x - mean) / std, 4), 0) / n;

  return m4 - 3; // Excess kurtosis
}

/**
 * Coefficient of variation
 */
export function coefficientOfVariation(values: number[]): number {
  const mean = ss.mean(values);
  if (mean === 0) return 0;

  const std = ss.standardDeviation(values);
  return std / Math.abs(mean);
}

/**
 * Detect ID-like columns using heuristics
 */
export function detectIdLikeColumns(data: any[], columnName: string): boolean {
  if (data.length === 0) return false;

  // Check column name patterns
  const idPatterns = /^(id|_id|ID|identifier|key|index|row_num|serial)$/i;
  if (idPatterns.test(columnName)) return true;

  // Check if all values are unique (high cardinality = potential ID)
  const uniqueValues = new Set(data.map((row) => row[columnName])).size;
  const uniqueRatio = uniqueValues / data.length;

  if (uniqueRatio > 0.95) {
    // Check if sequential
    const values = data.map((row) => row[columnName]).filter((v) => v != null);
    const numericValues = values.filter((v) => !isNaN(Number(v)));

    if (numericValues.length > values.length * 0.9) {
      return true; // Likely sequential ID
    }
  }

  return false;
}

/**
 * Detect datetime columns
 */
export function detectDatetimeColumns(
  data: any[],
  columnName: string
): boolean {
  if (data.length === 0) return false;

  const sample = data.slice(0, Math.min(100, data.length));
  let parseableCount = 0;
  let validDateCount = 0;

  for (const row of sample) {
    const value = row[columnName];
    if (value == null || value === "") continue;

    // Skip if the value is a pure number (not a date string)
    if (typeof value === 'number') {
      continue; // Don't treat numbers as dates
    }
    
    const strValue = String(value);
    
    // Check if it looks like a date (has separators like -, /, or :)
    const hasDateSeparator = /[-/:.]/.test(strValue);
    if (!hasDateSeparator) {
      continue; // Pure numbers without separators are not dates
    }

    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      // Additional check: year should be reasonable (1900-2100)
      const year = date.getFullYear();
      if (year >= 1900 && year <= 2100) {
        parseableCount++;
        validDateCount++;
      }
    }
  }

  // Need at least 70% valid dates AND at least some dates found
  const nonNullCount = sample.filter(row => row[columnName] != null && row[columnName] !== "").length;
  return nonNullCount > 0 && validDateCount / nonNullCount >= 0.7;
}

/**
 * Check if column is numeric
 */
export function isNumericColumn(data: any[], columnName: string): boolean {
  const values = data
    .map((row) => row[columnName])
    .filter((v) => v != null && v !== "");
  if (values.length === 0) return false;

  const numericCount = values.filter((v) => !isNaN(Number(v))).length;
  return numericCount / values.length > 0.9;
}

/**
 * Get numeric values from column
 */
export function getNumericValues(data: any[], columnName: string): number[] {
  return data
    .map((row) => row[columnName])
    .filter((v) => v != null && v !== "" && !isNaN(Number(v)))
    .map((v) => Number(v));
}

/**
 * Compute Pearson correlation between two arrays
 */
export function computePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Compute Spearman rank correlation
 */
export function computeSpearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const rankX = getRanks(x);
  const rankY = getRanks(y);

  return computePearsonCorrelation(rankX, rankY);
}

/**
 * Get ranks for Spearman correlation
 */
function getRanks(values: number[]): number[] {
  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((a, b) => a.value - b.value);

  const ranks = new Array(values.length);
  indexed.forEach((item, rank) => {
    ranks[item.index] = rank + 1;
  });

  return ranks;
}

/**
 * Compute Kendall's Tau
 */
export function computeKendallCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  let concordant = 0;
  let discordant = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const signX = Math.sign(x[j] - x[i]);
      const signY = Math.sign(y[j] - y[i]);

      if (signX * signY > 0) concordant++;
      else if (signX * signY < 0) discordant++;
    }
  }

  return (concordant - discordant) / (0.5 * n * (n - 1));
}

/**
 * Compute VIF for multicollinearity detection
 */
export function computeVIF(
  correlationMatrix: number[][],
  featureIndex: number
): number {
  // Simplified VIF calculation
  const n = correlationMatrix.length;
  if (n < 2) return 1;

  // Get correlations for this feature
  const correlations = correlationMatrix[featureIndex].filter(
    (_, i) => i !== featureIndex
  );
  const avgCorrelation =
    correlations.reduce((sum, r) => sum + Math.abs(r), 0) / correlations.length;

  const rSquared = avgCorrelation * avgCorrelation;
  if (rSquared >= 1) return 10;

  return 1 / (1 - rSquared);
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliersIQR(values: number[]): {
  lower: number;
  upper: number;
  outlierIndices: number[];
} {
  if (values.length < 4)
    return { lower: -Infinity, upper: Infinity, outlierIndices: [] };

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = ss.quantile(sorted, 0.25);
  const q3 = ss.quantile(sorted, 0.75);
  const iqr = q3 - q1;

  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  const outlierIndices = values
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v < lower || v > upper)
    .map(({ i }) => i);

  return { lower, upper, outlierIndices };
}

/**
 * Clip outliers to IQR boundaries
 */
export function clipOutliers(values: number[]): {
  clipped: number[];
  count: number;
} {
  const { lower, upper, outlierIndices } = detectOutliersIQR(values);

  const clipped = values.map((v) => {
    if (v < lower) return lower;
    if (v > upper) return upper;
    return v;
  });

  return { clipped, count: outlierIndices.length };
}

/**
 * Format bytes to readable size
 */
export function formatBytes(bytes: number): number {
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

/**
 * Check if column is constant
 */
export function isConstantColumn(data: any[], columnName: string): boolean {
  const values = data.map((row) => row[columnName]).filter((v) => v != null);
  if (values.length === 0) return true;

  const uniqueValues = new Set(values);
  return uniqueValues.size === 1;
}

/**
 * Impute missing values
 */
export function imputeMissing(
  data: any[],
  columnName: string,
  method: "median" | "mode"
): any[] {
  if (method === "median") {
    const numericValues = getNumericValues(data, columnName);
    if (numericValues.length === 0) return data;

    const median = ss.median(numericValues);
    return data.map((row) => ({
      ...row,
      [columnName]:
        row[columnName] == null || row[columnName] === ""
          ? median
          : row[columnName],
    }));
  } else {
    // Mode for categorical
    const values = data
      .map((row) => row[columnName])
      .filter((v) => v != null && v !== "");
    const counts = new Map<any, number>();
    values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));

    let mode: any = null;
    let maxCount = 0;
    counts.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count;
        mode = value;
      }
    });

    return data.map((row) => ({
      ...row,
      [columnName]:
        row[columnName] == null || row[columnName] === ""
          ? mode
          : row[columnName],
    }));
  }
}
