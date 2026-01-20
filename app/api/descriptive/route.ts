import { NextRequest, NextResponse } from "next/server";
import { computeDescriptiveStats } from "@/lib/descriptive";

export async function POST(request: NextRequest) {
  try {
    const { data, columnProfile } = await request.json();

    if (!data || !columnProfile) {
      return NextResponse.json(
        { error: "Invalid data or column profile provided" },
        { status: 400 }
      );
    }

    const stats = computeDescriptiveStats(data, columnProfile);

    return NextResponse.json({
      numericStats: stats.numeric,
      categoricalStats: stats.categorical,
    });
  } catch (error: any) {
    console.error("Descriptive analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compute descriptive statistics" },
      { status: 500 }
    );
  }
}
