import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { data, columnProfile } = await request.json();

    if (!data || !columnProfile) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Run full pipeline
    const results: any = {};

    // Step 1: Cleaning
    const cleaningResponse = await fetch(
      `${request.nextUrl.origin}/api/cleaning`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      }
    );
    results.cleaning = await cleaningResponse.json();

    // Step 2: Column types
    const columnTypesResponse = await fetch(
      `${request.nextUrl.origin}/api/column-types`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: results.cleaning.cleanedData }),
      }
    );
    results.columnProfile = await columnTypesResponse.json();

    // Step 3: Descriptive
    const descriptiveResponse = await fetch(
      `${request.nextUrl.origin}/api/descriptive`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: results.cleaning.cleanedData,
          columnProfile: results.columnProfile,
        }),
      }
    );
    results.descriptive = await descriptiveResponse.json();

    // Step 4: Diagnostic
    const diagnosticResponse = await fetch(
      `${request.nextUrl.origin}/api/diagnostic`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: results.cleaning.cleanedData,
          columnProfile: results.columnProfile,
        }),
      }
    );
    results.diagnostic = await diagnosticResponse.json();

    // Step 5: Predictive
    const predictiveResponse = await fetch(
      `${request.nextUrl.origin}/api/predictive`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: results.cleaning.cleanedData,
          columnProfile: results.columnProfile,
        }),
      }
    );
    results.predictive = await predictiveResponse.json();

    // Step 6: Prescriptive
    const prescriptiveResponse = await fetch(
      `${request.nextUrl.origin}/api/prescriptive`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: results.cleaning.cleanedData,
          columnProfile: results.columnProfile,
          predictiveResults: results.predictive,
          diagnosticStats: results.diagnostic,
        }),
      }
    );
    results.prescriptive = await prescriptiveResponse.json();

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Pipeline error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run analysis pipeline" },
      { status: 500 }
    );
  }
}
