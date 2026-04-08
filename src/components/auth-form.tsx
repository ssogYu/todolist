"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, applyAuthResponse } from "@/lib/api-client";
import type { AuthResponse } from "@/lib/types";

type AuthMode = "login" | "register";

const contentMap: Record<
  AuthMode,
  {
    title: string;
    description: string;
    submitLabel: string;
    alternateHref: string;
    alternateLabel: string;
  }
> = {
  login: {
    title: "欢迎回来",
    description: "登录后查看今日待办与群组协作进度。",
    submitLabel: "登录",
    alternateHref: "/register",
    alternateLabel: "还没有账号？去注册",
  },
  register: {
    title: "创建账号",
    description: "创建账号后即可开始规划每日任务并加入群组。",
    submitLabel: "注册并进入看板",
    alternateHref: "/login",
    alternateLabel: "已有账号？去登录",
  },
};

export function AuthForm({
  mode,
  redirectTo = "/dashboard",
}: {
  mode: AuthMode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const content = contentMap[mode];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      applyAuthResponse(response);
      router.replace(redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <Card className="w-full max-w-md border-white/80 bg-white/95">
        <CardHeader className="gap-3">
          <p className="text-sm font-medium text-primary">Todo</p>
          <CardTitle className="text-3xl">{content.title}</CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="username"
              >
                用户名
              </label>
              <Input
                id="username"
                minLength={3}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="输入户名"
                required
                value={username}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="password"
              >
                密码
              </label>
              <Input
                id="password"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位"
                required
                type="password"
                value={password}
              />
            </div>
            {error ? (
              <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? <Spinner /> : content.submitLabel}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              className="font-medium text-primary"
              href={content.alternateHref}
            >
              {content.alternateLabel}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
