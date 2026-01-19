import { NextRequest, NextResponse } from "next/server";
import { generatePrescriptiveInsights } from "@/lib/prescriptive";

export async function POST(request: NextRequest) {
  try {
    const { data, columnProfile, predictiveResults, diagnosticStats } =
      await request.json();

    if (!data || !columnProfile) {
      return NextResponse.json(
        { error: "Invalid data or column profile provided" },
        { status: 400 }
      );
    }

    const correlations = diagnosticStats?.correlations || [];

    const insights = generatePrescriptiveInsights(
      data,
      columnProfile,
      predictiveResults,
      correlations
    );

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error("Prescriptive analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate prescriptive insights" },
      { status: 500 }
    );
  }
}
