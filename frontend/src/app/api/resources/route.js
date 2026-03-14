import { NextResponse } from "next/server";
import { getResources } from "./loadResources";

export async function GET() {
  const resources = getResources();
  if (resources === null) {
    return NextResponse.json(
      {
        error: "all_resources.json not found",
        hint: "Run from repo root or ensure backend/all_resources.json exists",
      },
      { status: 503 }
    );
  }
  return NextResponse.json(resources);
}
