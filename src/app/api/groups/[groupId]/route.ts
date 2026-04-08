import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { getGroupBoard } from "@/lib/data";
import { requireGroupMembership } from "@/lib/group";
import { todayDateString } from "@/lib/date";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireAuthUser(request);
    const { groupId } = await params;
    const date = request.nextUrl.searchParams.get("date") ?? todayDateString();

    await requireGroupMembership(groupId, user.id);

    return NextResponse.json(await getGroupBoard(groupId, date));
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取群组失败";
    const status = message === "你还未加入该群组" ? 403 : 400;

    return NextResponse.json({ message }, { status });
  }
}
