import { NextResponse } from "next/server";
import { getMeta, getResources } from "../loadResources";

export async function GET() {
  const resources = getResources();
  if (resources === null) {
    return NextResponse.json(
      { error: "all_resources.json not found" },
      { status: 503 }
    );
  }
  const meta = getMeta();
  if (meta === null) {
    return NextResponse.json(
      { error: "Failed to compute meta" },
      { status: 503 }
    );
  }
  return NextResponse.json(meta);
}
