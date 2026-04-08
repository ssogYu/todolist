import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { notifyUserGroups, serializeTodo } from "@/lib/data";
import { toDateOnly, todayDateString } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { todoCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    const date = request.nextUrl.searchParams.get("date") ?? todayDateString();
    const targetDate = toDateOnly(date);
    const todos = await prisma.todo.findMany({
      where: {
        userId: user.id,
        targetDate,
      },
      orderBy: [{ isDone: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      date,
      todos: todos.map(serializeTodo),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "获取待办失败" },
      { status: 401 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthUser(request);
    const payload = todoCreateSchema.parse(await request.json());
    const todo = await prisma.todo.create({
      data: {
        content: payload.content,
        note: payload.note ?? null,
        category: payload.category,
        targetDate: toDateOnly(payload.targetDate),
        userId: user.id,
      },
    });

    await notifyUserGroups(user.id);

    return NextResponse.json(
      {
        todo: serializeTodo(todo),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "创建待办失败" },
      { status: 400 },
    );
  }
}
