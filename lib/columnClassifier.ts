import type { ColumnProfile, ColumnType } from "./types";
import { isNumericColumn, detectDatetimeColumns } from "./utils";

/**
 * Classify all columns semantically
 */
export function classifyColumns(data: any[]): ColumnProfile[] {
  if (data.length === 0) return [];

  const columns = Object.keys(data[0]);
  return columns.map((column) => classifyColumn(data, column));
}

/**
 * Classify a single column
 */
export function classifyColumn(data: any[], columnName: string): ColumnProfile {
  // Get non-null values
  const values = data
    .map((row) => row[columnName])
    .filter((v) => v != null && v !== "");
  const totalValues = data.length;
  const missingPct = ((totalValues - values.length) / totalValues) * 100;
  const uniqueValues = new Set(values).size;
  const uniqueRatio = uniqueValues / values.length;

  // Check datetime first
  if (detectDatetimeColumns(data, columnName)) {
    return {
      column: columnName,
      detectedType: "datetime",
      reasoning: "≥70% of values are parseable as dates/times",
      uniqueValues,
      missingPct: Number(missingPct.toFixed(2)),
    };
  }

  // Check if numeric
  if (isNumericColumn(data, columnName)) {
    const numericValues = values
      .filter((v) => !isNaN(Number(v)))
      .map((v) => Number(v));

    // Check if discrete (integers with low cardinality)
    const allIntegers = numericValues.every((v) => Number.isInteger(v));

    if (allIntegers && uniqueValues <= 20) {
      return {
        column: columnName,
        detectedType: "discrete",
        reasoning:
          "Integer values with low cardinality (≤20 unique values), suitable for countable states",
        uniqueValues,
        missingPct: Number(missingPct.toFixed(2)),
      };
    }

    // Check cardinality ratio for continuous
    if (uniqueRatio > 0.05) {
      return {
        column: columnName,
        detectedType: "continuous",
        reasoning:
          "High-cardinality numeric measurement (unique ratio > 5%), continuous distribution",
        uniqueValues,
        missingPct: Number(missingPct.toFixed(2)),
      };
    }

    // Low cardinality numeric, still continuous
    return {
      column: columnName,
      detectedType: "continuous",
      reasoning: "Numeric values with measurable precision",
      uniqueValues,
      missingPct: Number(missingPct.toFixed(2)),
    };
  }

  // Categorical
  if (uniqueRatio < 0.5 || uniqueValues <= 50) {
    return {
      column: columnName,
      detectedType: "categorical",
      reasoning:
        "Low cardinality with distinct named groups, suitable for categorization",
      uniqueValues,
      missingPct: Number(missingPct.toFixed(2)),
    };
  }

  // Default to unknown
  return {
    column: columnName,
    detectedType: "unknown",
    reasoning: "Unable to determine semantic type with high confidence",
    uniqueValues,
    missingPct: Number(missingPct.toFixed(2)),
  };
}

/**
 * Get columns by type
 */
export function getColumnsByType(
  columnProfile: ColumnProfile[],
  type: ColumnType
): string[] {
  return columnProfile
    .filter((col) => col.detectedType === type)
    .map((col) => col.column);
}
