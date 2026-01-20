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
 * Detect if a column is likely an ID column
 */
function isIdColumn(columnName: string, values: any[], uniqueRatio: number): boolean {
  const name = columnName.toLowerCase();
  const idPatterns = ['id', '_id', 'key', 'code', 'number', 'no', 'num'];
  const hasIdName = idPatterns.some(p => name.includes(p)) || name.endsWith('id');
  
  // High uniqueness (almost all values are unique)
  const isHighlyUnique = uniqueRatio > 0.8;
  
  return hasIdName && isHighlyUnique;
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
  const uniqueRatio = values.length > 0 ? uniqueValues / values.length : 0;

  // Check datetime first (only for string columns)
  const firstValue = values[0];
  const isStringColumn = typeof firstValue === 'string';
  
  if (isStringColumn && detectDatetimeColumns(data, columnName)) {
    return {
      column: columnName,
      detectedType: "datetime",
      reasoning: "Values are parseable as dates/times with date separators",
      uniqueValues,
      missingPct: Number(missingPct.toFixed(2)),
    };
  }

  // Check if numeric
  if (isNumericColumn(data, columnName)) {
    const numericValues = values
      .filter((v) => !isNaN(Number(v)))
      .map((v) => Number(v));

    // Check if ID column (high uniqueness, ID-like name)
    if (isIdColumn(columnName, values, uniqueRatio)) {
      return {
        column: columnName,
        detectedType: "continuous",
        reasoning: "ID-like column with high cardinality, treated as continuous identifier",
        uniqueValues,
        missingPct: Number(missingPct.toFixed(2)),
      };
    }

    // Check if discrete (integers with low cardinality)
    const allIntegers = numericValues.every((v) => Number.isInteger(v));
    
    // Binary column (0/1) - discrete
    const uniqueSet = new Set(numericValues);
    if (uniqueSet.size === 2 && uniqueSet.has(0) && uniqueSet.has(1)) {
      return {
        column: columnName,
        detectedType: "discrete",
        reasoning: "Binary indicator (0/1), suitable for classification target or flag",
        uniqueValues,
        missingPct: Number(missingPct.toFixed(2)),
      };
    }

    // Low cardinality integers
    if (allIntegers && uniqueValues <= 20 && uniqueRatio < 0.5) {
      return {
        column: columnName,
        detectedType: "discrete",
        reasoning: `Integer values with low cardinality (${uniqueValues} unique), suitable for countable states`,
        uniqueValues,
        missingPct: Number(missingPct.toFixed(2)),
      };
    }

    // Continuous numeric
    return {
      column: columnName,
      detectedType: "continuous",
      reasoning: `High-cardinality numeric measurement (${uniqueValues} unique values), continuous distribution`,
      uniqueValues,
      missingPct: Number(missingPct.toFixed(2)),
    };
  }

  // Categorical (non-numeric with limited unique values)
  if (uniqueRatio < 0.5 || uniqueValues <= 50) {
    return {
      column: columnName,
      detectedType: "categorical",
      reasoning: `Low cardinality (${uniqueValues} unique) with distinct named groups`,
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
