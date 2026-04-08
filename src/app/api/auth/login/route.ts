import { NextRequest, NextResponse } from "next/server";

import { buildAuthResponse, comparePassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const payload = authSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { username: payload.username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    const isValidPassword = await comparePassword(payload.password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    return NextResponse.json(
      buildAuthResponse({
        id: user.id,
        username: user.username,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "登录失败",
      },
      { status: 400 },
    );
  }
}
