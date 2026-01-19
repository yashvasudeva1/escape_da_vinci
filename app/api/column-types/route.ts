import { NextRequest, NextResponse } from "next/server";
import { classifyColumns } from "@/lib/columnClassifier";
import { callPythonBackend, isPythonBackendAvailable } from "@/lib/pythonClient";

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid data provided" },
        { status: 400 }
      );
    }

    // Try Python backend first
    const pythonAvailable = await isPythonBackendAvailable();
    
    if (pythonAvailable) {
      try {
        console.log('Using Python backend for column classification');
        const result = await callPythonBackend('/api/python/column-types', { data });
        return NextResponse.json(result.columnProfile);
      } catch (error) {
        console.warn('Python backend failed, falling back to TypeScript implementation');
      }
    }

    // Fallback to TypeScript implementation
    const columnProfile = classifyColumns(data);
    return NextResponse.json(columnProfile);
  } catch (error: any) {
    console.error("Column classification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to classify columns" },
      { status: 500 }
    );
  }
}
