import { prisma } from "@/lib/prisma";
import { toDateOnly, toDateString, todayDateString } from "@/lib/date";
import type { GroupBoard, GroupListItem, TodoItem } from "@/lib/types";
import { sendGroupSync } from "@/lib/sse";

type GroupMembershipRecord = {
  group: {
    id: string;
    name: string;
    inviteCode: string;
    _count: {
      members: number;
    };
  };
};

type GroupBoardRecord = {
  id: string;
  name: string;
  inviteCode: string;
  members: Array<{
    user: {
      id: string;
      username: string;
      todos: Array<{
        id: string;
        content: string;
        isDone: boolean;
        targetDate: Date;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
      }>;
    };
  }>;
};

export function serializeTodo(todo: {
  id: string;
  content: string;
  isDone: boolean;
  targetDate: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const serialized: TodoItem = {
    id: todo.id,
    content: todo.content,
    isDone: todo.isDone,
    targetDate: toDateString(todo.targetDate),
    userId: todo.userId,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };

  return serialized;
}

export async function notifyUserGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });

  for (const membership of memberships) {
    sendGroupSync(membership.groupId);
  }
}

export async function getUserGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  return (memberships as GroupMembershipRecord[]).map(
    (membership): GroupListItem => ({
      id: membership.group.id,
      name: membership.group.name,
      inviteCode: membership.group.inviteCode,
      memberCount: membership.group._count.members,
    }),
  );
}

export async function getGroupBoard(groupId: string, date = todayDateString()) {
  const targetDate = toDateOnly(date);
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            include: {
              todos: {
                where: {
                  targetDate,
                },
                orderBy: [{ isDone: "asc" }, { createdAt: "asc" }],
              },
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
    },
  });

  if (!group) {
    throw new Error("群组不存在");
  }

  const typedGroup = group as GroupBoardRecord;

  const board: GroupBoard = {
    group: {
      id: typedGroup.id,
      name: typedGroup.name,
      inviteCode: typedGroup.inviteCode,
    },
    date,
    members: typedGroup.members.map((member) => {
      const todos = member.user.todos.map(serializeTodo);

      return {
        user: {
          id: member.user.id,
          username: member.user.username,
        },
        todos,
        completedCount: todos.filter((todo) => todo.isDone).length,
        totalCount: todos.length,
      };
    }),
  };

  return board;
}
