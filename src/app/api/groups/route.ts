import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { getUserGroups } from "@/lib/data";
import { generateInviteCode } from "@/lib/group";
import { prisma } from "@/lib/prisma";
import { groupSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    const groups = await getUserGroups(user.id);

    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "获取群组失败" },
      { status: 401 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    const payload = groupSchema.parse(await request.json());

    let inviteCode = generateInviteCode();

    for (let index = 0; index < 5; index += 1) {
      const existingGroup = await prisma.group.findUnique({
        where: { inviteCode },
        select: { id: true },
      });

      if (!existingGroup) {
        break;
      }

      inviteCode = generateInviteCode();
    }

    const group = await prisma.group.create({
      data: {
        name: payload.name,
        inviteCode,
        members: {
          create: {
            userId: user.id,
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        group: {
          id: group.id,
          name: group.name,
          inviteCode: group.inviteCode,
          memberCount: group._count.members,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "创建群组失败" },
      { status: 400 },
    );
  }
}
