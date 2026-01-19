import { NextRequest, NextResponse } from "next/server";
import { trainBaselineModel } from "@/lib/predictive";

export async function POST(request: NextRequest) {
  try {
    const { data, columnProfile } = await request.json();

    if (!data || !columnProfile) {
      return NextResponse.json(
        { error: "Invalid data or column profile provided" },
        { status: 400 }
      );
    }

    const results = trainBaselineModel(data, columnProfile);

    if (!results) {
      return NextResponse.json(
        { error: "Unable to train model - insufficient data or features" },
        { status: 400 }
      );
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Predictive analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to train predictive model" },
      { status: 500 }
    );
  }
}
