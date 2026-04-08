import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { joinGroupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    const payload = joinGroupSchema.parse(await request.json());
    const group = await prisma.group.findUnique({
      where: {
        inviteCode: payload.inviteCode,
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ message: "邀请码不存在" }, { status: 404 });
    }

    await prisma.groupMember.upsert({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: group.id,
        },
      },
      create: {
        userId: user.id,
        groupId: group.id,
      },
      update: {},
    });

    const memberCount = await prisma.groupMember.count({
      where: {
        groupId: group.id,
      },
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
        memberCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "加入群组失败" },
      { status: 400 },
    );
  }
}
