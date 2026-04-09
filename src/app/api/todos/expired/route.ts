import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { notifyUserGroups, serializeTodo } from "@/lib/data";
import { toDateOnly, todayDateString } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { expiredTodoActionSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    const today = todayDateString();
    const expiredTodos = await prisma.todo.findMany({
      where: {
        userId: user.id,
        isDone: false,
        targetDate: {
          lt: toDateOnly(today),
        },
      },
      orderBy: [{ targetDate: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      expiredTodos: expiredTodos.map(serializeTodo),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "获取未完成任务失败" },
      { status: 401 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    const payload = expiredTodoActionSchema.parse(await request.json());
    const today = todayDateString();
    const expiredTodos = await prisma.todo.findMany({
      where: {
        id: { in: payload.todoIds },
        userId: user.id,
        isDone: false,
        targetDate: {
          lt: toDateOnly(today),
        },
      },
      select: { id: true },
    });
    const expiredTodoIds = expiredTodos.map((todo) => todo.id);

    if (expiredTodoIds.length === 0) {
      return NextResponse.json({ success: true, affectedCount: 0 });
    }

    if (payload.action === "moveToToday") {
      await prisma.todo.updateMany({
        where: { id: { in: expiredTodoIds } },
        data: { targetDate: toDateOnly(today) },
      });
    } else {
      await prisma.todo.deleteMany({
        where: { id: { in: expiredTodoIds } },
      });
    }

    await notifyUserGroups(user.id);

    return NextResponse.json({
      success: true,
      affectedCount: expiredTodoIds.length,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "处理未完成任务失败" },
      { status: 400 },
    );
  }
}
