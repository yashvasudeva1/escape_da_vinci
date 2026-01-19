import { NextRequest, NextResponse } from "next/server";
import { cleanDataset } from "@/lib/cleaning";

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid data provided" },
        { status: 400 }
      );
    }

    const result = cleanDataset(data);

    return NextResponse.json({
      before: result.before,
      after: result.after,
      cleaningLog: result.cleaningLog,
      missingSummary: result.missingSummary,
      outlierSummary: result.outlierSummary,
      cleanedData: result.cleanedData,
    });
  } catch (error: any) {
    console.error("Cleaning error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clean dataset" },
      { status: 500 }
    );
  }
}
