"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, readStoredToken } from "@/lib/api-client";
import { todayDateString } from "@/lib/date";
import type { GroupBoard } from "@/lib/types";

type ConnectionState = "connecting" | "live" | "reconnecting";

export function GroupBoardClient({ groupId }: { groupId: string }) {
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [board, setBoard] = useState<GroupBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<GroupBoard>(
        `/api/groups/${groupId}?date=${selectedDate}`,
      );

      setBoard(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载群组失败");
    } finally {
      setLoading(false);
    }
  }, [groupId, selectedDate]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    const token = readStoredToken();

    if (!token) {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let active = true;

    const connect = () => {
      if (!active) {
        return;
      }

      setConnectionState(eventSource ? "reconnecting" : "connecting");

      eventSource = new EventSource(
        `/api/groups/${groupId}/events?token=${encodeURIComponent(token)}`,
      );

      eventSource.addEventListener("sync", () => {
        void loadBoard();
      });

      eventSource.onopen = () => {
        setConnectionState("live");
      };

      eventSource.onerror = () => {
        setConnectionState("reconnecting");
        eventSource?.close();
        reconnectTimer = window.setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      active = false;
      eventSource?.close();
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
    };
  }, [groupId, loadBoard]);

  const memberCount = useMemo(
    () => board?.members.length ?? 0,
    [board?.members.length],
  );

  const totalCompleted = useMemo(
    () => board?.members.reduce((acc, m) => acc + m.completedCount, 0) ?? 0,
    [board?.members],
  );

  const totalTodos = useMemo(
    () => board?.members.reduce((acc, m) => acc + m.totalCount, 0) ?? 0,
    [board?.members],
  );

  return (
    <div className="min-h-screen bg-page relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary/4 via-primary/1 to-transparent rounded-full blur-3xl -translate-y-1/2 pointer-events-none opacity-50" />

      <div className="relative mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-primary/80 hover:text-primary transition-colors group"
              href="/dashboard"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回个人看板
            </Link>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl shadow-lg shadow-primary/10">
                🌿
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {board?.group.name ?? "群组详情"}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {memberCount} 人
                  </span>
                  <span className="text-border">·</span>
                  <span>
                    邀请码{" "}
                    <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                      {board?.group.inviteCode ?? "--"}
                    </code>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <Input
                className="w-[140px] h-10 text-sm bg-card/80 border-border/50 rounded-xl"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
              <span className="text-xs text-muted-foreground">
                {selectedDate === todayDateString()
                  ? "今天"
                  : new Date(selectedDate).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                    })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  connectionState === "live"
                    ? "bg-primary/10 text-primary"
                    : connectionState === "reconnecting"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-secondary text-secondary-foreground"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    connectionState === "live"
                      ? "bg-primary animate-pulse"
                      : connectionState === "reconnecting"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-current"
                  }`}
                />
                {connectionState === "live"
                  ? "实时同步"
                  : connectionState === "reconnecting"
                    ? "重连中..."
                    : "连接中"}
              </div>
            </div>
          </div>
        </header>

        <div className="mb-8 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 shadow-lg shadowforeground/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-muted-foreground">
                今日群组进度
              </h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {totalCompleted}
                </span>
                <span className="text-2xl font-bold text-muted-foreground">
                  /
                </span>
                <span className="text-2xl font-medium text-muted-foreground">
                  {totalTodos}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  已完成
                </span>
              </div>
            </div>
            {totalTodos > 0 && (
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>完成率</span>
                  <span className="font-medium text-primary">
                    {Math.round((totalCompleted / totalTodos) * 100)}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700 ease-out"
                    style={{ width: `${(totalCompleted / totalTodos) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-sm text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : (
          <>
            {memberCount === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/50 bg-secondary/10 py-20 text-center">
                <div className="text-5xl mb-4">🌱</div>
                <p className="text-base font-medium text-foreground/70">
                  暂无成员数据
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  群组成员还未添加任何待办
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {board?.members.map((member, index) => {
                  const memberProgress =
                    member.totalCount > 0
                      ? (member.completedCount / member.totalCount) * 100
                      : 0;
                  return (
                    <div
                      key={member.user.id}
                      className="group rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 shadow-md shadowforeground/5 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-lg font-semibold text-primary shadow-sm">
                              {member.user.username.charAt(0).toUpperCase()}
                            </div>
                            {member.completedCount === member.totalCount &&
                              member.totalCount > 0 && (
                                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground shadow-lg">
                                  ✓
                                </div>
                              )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {member.user.username}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {member.totalCount === 0
                                ? "暂无计划"
                                : member.completedCount === member.totalCount
                                  ? "已完成全部 ✓"
                                  : `进行中 ${member.completedCount}/${member.totalCount}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            {member.completedCount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            / {member.totalCount}
                          </div>
                        </div>
                      </div>

                      {member.totalCount > 0 && (
                        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                            style={{ width: `${memberProgress}%` }}
                          />
                        </div>
                      )}

                      <div
                        className="space-y-2 overflow-y-auto"
                        style={{ maxHeight: "500px" }}
                      >
                        {member.todos.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border/50 bg-secondary/10 py-6 text-center">
                            <p className="text-xs text-muted-foreground">
                              今天还没有任务
                            </p>
                          </div>
                        ) : (
                          member.todos.map((todo) => (
                            <div
                              className="flex items-start gap-2.5 rounded-lg bg-secondary/30 px-3 py-2.5 transition-colors group-hover:bg-secondary/40"
                              key={todo.id}
                            >
                              <div
                                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border transition-all ${
                                  todo.isDone
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border/50"
                                }`}
                              >
                                {todo.isDone && (
                                  <svg
                                    className="w-2.5 h-2.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                                <p
                                  className={`text-sm flex-1 ${todo.isDone ? "text-muted-foreground line-through" : "text-foreground"}`}
                                >
                                  {todo.content}
                                </p>
                                <span
                                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0 ${todo.category === "WORK" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}
                                >
                                  {todo.category === "WORK"
                                    ? "💼 工作"
                                    : "🏠 个人"}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <footer className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
          <span>协作</span>
          <span className="inline-block h-1 w-1 rounded-full bg-primary" />
          <span>成长</span>
          <span className="inline-block h-1 w-1 rounded-full bg-primary" />
          <span>共赢</span>
        </footer>
      </div>
    </div>
  );
}
