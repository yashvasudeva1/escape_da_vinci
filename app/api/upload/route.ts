import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  flattenData,
  removeUnnamedColumns,
} from "@/lib/ingestion";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file as buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse based on file type
    let result: { data: any[]; metadata: any };
    
    if (file.name.endsWith(".csv")) {
      // Parse CSV from text
      const text = buffer.toString('utf-8');
      const parsed = Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      
      result = {
        data: parsed.data,
        metadata: {
          filename: file.name,
          rows: parsed.data.length,
          columns: Object.keys(parsed.data[0] || {}).length,
        },
      };
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      // Parse Excel from buffer
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);
      
      result = {
        data,
        metadata: {
          filename: file.name,
          rows: data.length,
          columns: Object.keys(data[0] || {}).length,
        },
      };
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload CSV or Excel file." },
        { status: 400 }
      );
    }

    // Flatten and clean column names
    let { data } = result;
    data = flattenData(data);
    data = removeUnnamedColumns(data);

    // Update result with cleaned data
    result.data = data;
    result.metadata.rows = data.length;
    result.metadata.columns = Object.keys(data[0] || {}).length;

    return NextResponse.json({
      data: data,
      metadata: {
        filename: result.metadata.filename,
        rows: result.metadata.rows,
        columns: result.metadata.columns,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
