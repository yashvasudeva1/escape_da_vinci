import { NextRequest, NextResponse } from "next/server";
import { computeDiagnosticStats } from "@/lib/diagnostic";

export async function POST(request: NextRequest) {
  try {
    const { data, columnProfile } = await request.json();

    if (!data || !columnProfile) {
      return NextResponse.json(
        { error: "Invalid data or column profile provided" },
        { status: 400 }
      );
    }

    const diagnostics = computeDiagnosticStats(data, columnProfile);

    return NextResponse.json({
      correlations: diagnostics.correlations,
      multicollinearity: diagnostics.multicollinearity,
      pearsonMatrix: diagnostics.pearsonMatrix,
    });
  } catch (error: any) {
    console.error("Diagnostic analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compute diagnostic statistics" },
      { status: 500 }
    );
  }
}
