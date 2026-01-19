import * as ss from "simple-statistics";
import type { NumericStats, CategoricalStats, ColumnProfile } from "./types";
import {
  getNumericValues,
  computeSkewness,
  computeKurtosis,
  coefficientOfVariation,
  computeEntropy,
} from "./utils";

export interface DescriptiveResult {
  numeric: NumericStats[];
  categorical: CategoricalStats[];
}

/**
 * Compute descriptive statistics for all columns
 */
export function computeDescriptiveStats(
  data: any[],
  columnProfile: ColumnProfile[]
): DescriptiveResult {
  const numericColumns = columnProfile.filter(
    (col) =>
      col.detectedType === "continuous" || col.detectedType === "discrete"
  );

  const categoricalColumns = columnProfile.filter(
    (col) => col.detectedType === "categorical"
  );

  return {
    numeric: numericColumns.map((col) => computeNumericStats(data, col.column)),
    categorical: categoricalColumns.map((col) =>
      computeCategoricalStats(data, col.column)
    ),
  };
}

/**
 * Compute numeric column statistics
 */
function computeNumericStats(data: any[], columnName: string): NumericStats {
  const values = getNumericValues(data, columnName);

  if (values.length === 0) {
    return {
      column: columnName,
      mean: 0,
      median: 0,
      std: 0,
      skewness: 0,
      kurtosis: 0,
      cv: 0,
      min: 0,
      max: 0,
      q25: 0,
      q75: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);

  return {
    column: columnName,
    mean: Number(ss.mean(values).toFixed(2)),
    median: Number(ss.median(values).toFixed(2)),
    std: Number(ss.standardDeviation(values).toFixed(2)),
    skewness: Number(computeSkewness(values).toFixed(2)),
    kurtosis: Number(computeKurtosis(values).toFixed(2)),
    cv: Number(coefficientOfVariation(values).toFixed(2)),
    min: Number(ss.min(values).toFixed(2)),
    max: Number(ss.max(values).toFixed(2)),
    q25: Number(ss.quantile(sorted, 0.25).toFixed(2)),
    q75: Number(ss.quantile(sorted, 0.75).toFixed(2)),
  };
}

/**
 * Compute categorical column statistics
 */
function computeCategoricalStats(
  data: any[],
  columnName: string
): CategoricalStats {
  const values = data
    .map((row) => row[columnName])
    .filter((v) => v != null && v !== "");

  if (values.length === 0) {
    return {
      column: columnName,
      uniqueCount: 0,
      entropy: 0,
      topCategories: [],
      dominantCategory: "",
      dominantPct: 0,
    };
  }

  // Count frequencies
  const counts = new Map<any, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));

  // Sort by frequency
  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({
      value: String(value),
      count,
      percent: Number(((count / values.length) * 100).toFixed(1)),
    }));

  const topCategories = sorted.slice(0, 10);
  const dominant = sorted[0];

  return {
    column: columnName,
    uniqueCount: counts.size,
    entropy: Number(computeEntropy(values).toFixed(2)),
    topCategories,
    dominantCategory: dominant?.value || "",
    dominantPct: dominant?.percent || 0,
  };
}

/**
 * Generate distribution bins for numeric column
 */
export function generateDistributionBins(
  data: any[],
  columnName: string,
  binCount: number = 10
): Array<{ range: string; count: number }> {
  const values = getNumericValues(data, columnName);

  if (values.length === 0) return [];

  const min = ss.min(values);
  const max = ss.max(values);
  const binWidth = (max - min) / binCount;

  const bins: Array<{ range: string; count: number }> = [];

  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    const binEnd = i === binCount - 1 ? max : binStart + binWidth;

    const count = values.filter((v) => v >= binStart && v <= binEnd).length;

    bins.push({
      range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      count,
    });
  }

  return bins;
}
