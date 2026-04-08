import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8) {
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * ALPHABET.length);
    return ALPHABET[index];
  }).join("");
}

export async function requireGroupMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership) {
    throw new Error("你还未加入该群组");
  }
}

export function parseSseToken(token: string | null) {
  if (!token) {
    throw new Error("缺少 token");
  }

  return verifyToken(token);
}
