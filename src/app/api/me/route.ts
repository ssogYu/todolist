import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }
}
