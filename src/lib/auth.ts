import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

type TokenPayload = {
  userId: string;
  username: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET 未配置");
  }

  return secret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}

export function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function requireAuthUser(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    throw new Error("未登录");
  }

  const payload = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true },
  });

  if (!user) {
    throw new Error("用户不存在");
  }

  return user;
}

export function serializeAuthUser(user: { id: string; username: string }) {
  return {
    id: user.id,
    username: user.username,
  };
}

export function buildAuthResponse(user: { id: string; username: string }) {
  return {
    token: signToken({
      userId: user.id,
      username: user.username,
    }),
    user: serializeAuthUser(user),
  };
}
