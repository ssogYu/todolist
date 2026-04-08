import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { notifyUserGroups, serializeTodo } from "@/lib/data";
import { toDateOnly } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { todoPatchSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> },
) {
  try {
    const user = await requireAuthUser(request);
    const payload = todoPatchSchema.parse(await request.json());
    const { todoId } = await params;
    const existingTodo = await prisma.todo.findUnique({
      where: { id: todoId },
      select: { id: true, userId: true },
    });

    if (!existingTodo || existingTodo.userId !== user.id) {
      return NextResponse.json({ message: "待办不存在" }, { status: 404 });
    }

    const todo = await prisma.todo.update({
      where: { id: todoId },
      data: {
        ...(payload.content ? { content: payload.content } : {}),
        ...(payload.note !== undefined ? { note: payload.note ?? null } : {}),
        ...(payload.category ? { category: payload.category } : {}),
        ...(payload.targetDate
          ? { targetDate: toDateOnly(payload.targetDate) }
          : {}),
        ...(typeof payload.isDone === "boolean"
          ? { isDone: payload.isDone }
          : {}),
      },
    });

    await notifyUserGroups(user.id);

    return NextResponse.json({
      todo: serializeTodo(todo),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "更新待办失败" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> },
) {
  try {
    const user = await requireAuthUser(request);
    const { todoId } = await params;
    const existingTodo = await prisma.todo.findUnique({
      where: { id: todoId },
      select: { id: true, userId: true },
    });

    if (!existingTodo || existingTodo.userId !== user.id) {
      return NextResponse.json({ message: "待办不存在" }, { status: 404 });
    }

    await prisma.todo.delete({
      where: { id: todoId },
    });

    await notifyUserGroups(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "删除待办失败" },
      { status: 400 },
    );
  }
}
