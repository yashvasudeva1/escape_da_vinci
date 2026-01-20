import Papa from "papaparse";
import * as XLSX from "xlsx";
import { formatBytes } from "./utils";

export interface ParseResult {
  data: any[];
  metadata: {
    datasetName: string;
    rows: number;
    columns: number;
    memoryMB: number;
    uploadedAt: string;
  };
  preview: any[];
}

/**
 * Parse CSV file
 */
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];

        // Calculate memory size (rough estimate)
        const jsonString = JSON.stringify(data);
        const bytes = new Blob([jsonString]).size;

        resolve({
          data,
          metadata: {
            datasetName: file.name,
            rows: data.length,
            columns: Object.keys(data[0] || {}).length,
            memoryMB: formatBytes(bytes),
            uploadedAt: new Date().toISOString(),
          },
          preview: data.slice(0, 20),
        });
      },
      error: (error) => reject(error),
    });
  });
}

/**
 * Parse Excel file
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  // Use first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json(sheet, { defval: null });

  // Calculate memory size
  const jsonString = JSON.stringify(data);
  const bytes = new Blob([jsonString]).size;

  return {
    data,
    metadata: {
      datasetName: file.name,
      rows: data.length,
      columns: Object.keys(data[0] || {}).length,
      memoryMB: formatBytes(bytes),
      uploadedAt: new Date().toISOString(),
    },
    preview: data.slice(0, 20),
  };
}

/**
 * Flatten nested structures in data
 */
export function flattenData(data: any[]): any[] {
  return data.map((row) => {
    const flattened: any = {};

    Object.entries(row).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        // Flatten nested object
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          flattened[`${key}_${nestedKey}`] = nestedValue;
        });
      } else {
        flattened[key] = value;
      }
    });

    return flattened;
  });
}

/**
 * Remove unnamed columns
 */
export function removeUnnamedColumns(data: any[]): any[] {
  if (data.length === 0) return data;

  const columns = Object.keys(data[0]);
  const namedColumns = columns.filter(
    (col) =>
      col &&
      col.trim() !== "" &&
      !col.startsWith("Unnamed") &&
      !col.startsWith("__")
  );

  return data.map((row) => {
    const filtered: any = {};
    namedColumns.forEach((col) => {
      filtered[col] = row[col];
    });
    return filtered;
  });
}
