import type { CleaningAction } from "./types";
import {
  detectIdLikeColumns,
  isConstantColumn,
  isNumericColumn,
  getNumericValues,
  clipOutliers,
  imputeMissing,
} from "./utils";

export interface CleaningResult {
  cleanedData: any[];
  cleaningLog: CleaningAction[];
  before: { rows: number; columns: number };
  after: { rows: number; columns: number };
  missingSummary: Array<{ column: string; missing: number; imputed: number }>;
  outlierSummary: Array<{ column: string; outliers: number; clipped: number }>;
}

/**
 * Execute full cleaning pipeline
 */
export function cleanDataset(data: any[]): CleaningResult {
  if (data.length === 0) {
    throw new Error("Cannot clean empty dataset");
  }

  const cleaningLog: CleaningAction[] = [];
  const before = {
    rows: data.length,
    columns: Object.keys(data[0]).length,
  };

  let cleaned = [...data];
  const columns = Object.keys(cleaned[0]);

  // Step 1: Remove duplicates
  const { data: deduped, removed: dupesRemoved } = removeDuplicates(cleaned);
  cleaned = deduped;
  if (dupesRemoved > 0) {
    cleaningLog.push({
      action: "Remove duplicates",
      reason: `${dupesRemoved} duplicate rows detected`,
      rowsAffected: dupesRemoved,
    });
  }

  // Step 2: Remove ID-like columns
  const columnsToRemove: string[] = [];
  columns.forEach((col) => {
    if (detectIdLikeColumns(cleaned, col)) {
      columnsToRemove.push(col);
      cleaningLog.push({
        action: "Removed",
        column: col,
        reason: "ID-like column (high cardinality, no predictive value)",
        rowsAffected: 0,
      });
    }
  });

  // Step 3: Remove constant columns
  columns.forEach((col) => {
    if (!columnsToRemove.includes(col) && isConstantColumn(cleaned, col)) {
      columnsToRemove.push(col);
      cleaningLog.push({
        action: "Removed",
        column: col,
        reason: "Constant column (single unique value)",
        rowsAffected: 0,
      });
    }
  });

  // Remove identified columns
  cleaned = removeColumns(cleaned, columnsToRemove);

  // Step 4: Handle missing values
  const missingSummary: Array<{
    column: string;
    missing: number;
    imputed: number;
  }> = [];
  const remainingColumns = Object.keys(cleaned[0]);

  remainingColumns.forEach((col) => {
    const missingCount = cleaned.filter(
      (row) => row[col] == null || row[col] === ""
    ).length;

    if (missingCount > 0) {
      const method = isNumericColumn(cleaned, col) ? "median" : "mode";
      cleaned = imputeMissing(cleaned, col, method);

      missingSummary.push({
        column: col,
        missing: missingCount,
        imputed: missingCount,
      });

      cleaningLog.push({
        action: "Missing value imputation",
        column: col,
        reason: `${
          method.charAt(0).toUpperCase() + method.slice(1)
        } imputation for ${missingCount} missing entries`,
        rowsAffected: missingCount,
      });
    }
  });

  // Step 5: Outlier clipping for numeric columns
  const outlierSummary: Array<{
    column: string;
    outliers: number;
    clipped: number;
  }> = [];

  remainingColumns.forEach((col) => {
    if (isNumericColumn(cleaned, col)) {
      const values = getNumericValues(cleaned, col);
      const { clipped, count } = clipOutliers(values);

      if (count > 0) {
        // Apply clipping
        let valueIndex = 0;
        cleaned = cleaned.map((row) => {
          if (row[col] != null && row[col] !== "" && !isNaN(Number(row[col]))) {
            return { ...row, [col]: clipped[valueIndex++] };
          }
          return row;
        });

        outlierSummary.push({
          column: col,
          outliers: count,
          clipped: count,
        });

        cleaningLog.push({
          action: "Outlier clipping",
          column: col,
          reason: "Values beyond IQR boundaries (Q1 - 1.5×IQR, Q3 + 1.5×IQR)",
          rowsAffected: count,
        });
      }
    }
  });

  const after = {
    rows: cleaned.length,
    columns: Object.keys(cleaned[0]).length,
  };

  return {
    cleanedData: cleaned,
    cleaningLog,
    before,
    after,
    missingSummary,
    outlierSummary,
  };
}

/**
 * Remove duplicate rows
 */
function removeDuplicates(data: any[]): { data: any[]; removed: number } {
  const seen = new Set<string>();
  const unique: any[] = [];

  data.forEach((row) => {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row);
    }
  });

  return {
    data: unique,
    removed: data.length - unique.length,
  };
}

/**
 * Remove specified columns
 */
function removeColumns(data: any[], columnsToRemove: string[]): any[] {
  return data.map((row) => {
    const filtered: any = {};
    Object.keys(row).forEach((key) => {
      if (!columnsToRemove.includes(key)) {
        filtered[key] = row[key];
      }
    });
    return filtered;
  });
}
