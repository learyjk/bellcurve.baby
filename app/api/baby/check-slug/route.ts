import { NextResponse } from "next/server";
import { getPoolBySlug } from "@/lib/data/pool/getPoolBySlug";

// GET /api/baby/check-slug?slug=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug || typeof slug !== "string") {
    return NextResponse.json(
      { available: false, error: "No slug provided" },
      { status: 400 }
    );
  }
  try {
    const pool = await getPoolBySlug(slug);
    if (!pool) {
      return NextResponse.json({ available: true });
    } else {
      return NextResponse.json({ available: false });
    }
  } catch {
    return NextResponse.json(
      { available: false, error: "Error checking slug" },
      { status: 500 }
    );
  }
}
