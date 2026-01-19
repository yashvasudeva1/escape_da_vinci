import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { data, filename, format } = await request.json();

    if (!data || !filename) {
      return NextResponse.json(
        { error: "Invalid export parameters" },
        { status: 400 }
      );
    }

    if (format === "csv") {
      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csvRows = [headers.join(",")];

      data.forEach((row: any) => {
        const values = headers.map((header) => {
          const value = row[header];
          // Escape commas and quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvRows.push(values.join(","));
      });

      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "json") {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported export format" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export data" },
      { status: 500 }
    );
  }
}
