import { NextRequest, NextResponse } from "next/server";
import { classifyColumns } from "@/lib/columnClassifier";

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid data provided" },
        { status: 400 }
      );
    }

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
