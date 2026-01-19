import type { ColumnProfile } from "./types";

/**
 * Auto-detect target column for supervised learning
 */
export function autoDetectTarget(
  data: any[],
  columnProfile: ColumnProfile[]
): string | null {
  if (data.length === 0 || columnProfile.length === 0) return null;

  const columns = columnProfile.map((col) => col.column);

  // Strategy 1: Check for common target column names
  const targetPatterns = [
    /^target$/i,
    /^label$/i,
    /^class$/i,
    /^y$/i,
    /^outcome$/i,
    /^result$/i,
    /^churn$/i,
    /^fraud$/i,
    /^default$/i,
    /^survived$/i,
    /^price$/i,
    /^sales$/i,
    /^revenue$/i,
  ];

  for (const pattern of targetPatterns) {
    const match = columns.find((col) => pattern.test(col));
    if (match) return match;
  }

  // Strategy 2: Look for binary categorical columns (common in classification)
  const binaryCategorical = columnProfile.filter(
    (col) => col.detectedType === "categorical" && col.uniqueValues === 2
  );

  if (binaryCategorical.length > 0) {
    // Prefer columns with yes/no, true/false patterns
    for (const col of binaryCategorical) {
      const values = new Set(
        data
          .map((row) => String(row[col.column]).toLowerCase())
          .filter((v) => v)
      );
      const hasYesNo = values.has("yes") && values.has("no");
      const hasTrueFalse = values.has("true") && values.has("false");
      const has10 = values.has("1") && values.has("0");

      if (hasYesNo || hasTrueFalse || has10) {
        return col.column;
      }
    }
    return binaryCategorical[0].column;
  }

  // Strategy 3: Last column heuristic (common convention)
  const lastColumn = columns[columns.length - 1];
  const lastProfile = columnProfile.find((col) => col.column === lastColumn);

  if (
    lastProfile &&
    (lastProfile.detectedType === "categorical" ||
      lastProfile.detectedType === "discrete")
  ) {
    return lastColumn;
  }

  return null;
}

/**
 * Determine if task is classification or regression
 */
export function determineTaskType(
  data: any[],
  targetColumn: string,
  columnProfile: ColumnProfile[]
): "classification" | "regression" | "unknown" {
  const profile = columnProfile.find((col) => col.column === targetColumn);
  if (!profile) return "unknown";

  if (
    profile.detectedType === "categorical" ||
    profile.detectedType === "discrete"
  ) {
    return "classification";
  }

  if (profile.detectedType === "continuous") {
    return "regression";
  }

  return "unknown";
}

/**
 * Select features for modeling
 */
export function selectFeatures(
  data: any[],
  targetColumn: string,
  columnProfile: ColumnProfile[]
): string[] {
  return columnProfile
    .filter((col) => {
      // Exclude target
      if (col.column === targetColumn) return false;

      // Exclude datetime
      if (col.detectedType === "datetime") return false;

      // Exclude unknown types
      if (col.detectedType === "unknown") return false;

      // Include numeric and categorical
      return true;
    })
    .map((col) => col.column);
}
