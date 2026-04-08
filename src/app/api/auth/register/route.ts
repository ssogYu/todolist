import { NextRequest, NextResponse } from "next/server";

import { buildAuthResponse, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const payload = authSchema.parse(await request.json());
    const existingUser = await prisma.user.findUnique({
      where: { username: payload.username },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ message: "用户名已存在" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        username: payload.username,
        passwordHash: await hashPassword(payload.password),
      },
      select: {
        id: true,
        username: true,
      },
    });

    return NextResponse.json(buildAuthResponse(user), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "注册失败",
      },
      { status: 400 },
    );
  }
}
