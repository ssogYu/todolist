"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { apiFetch, readStoredToken } from "@/lib/api-client";
import { formatDisplayDate, todayDateString } from "@/lib/date";
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

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Link
              className="text-sm font-medium text-primary"
              href="/dashboard"
            >
              返回个人看板
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {board?.group.name ?? "群组详情"}
              </h1>
              <Badge>{formatDisplayDate(selectedDate)}</Badge>
              <Badge
                className={
                  connectionState === "live"
                    ? "bg-primary/12 text-primary"
                    : "bg-secondary text-secondary-foreground"
                }
              >
                {connectionState === "live" ? "实时同步中" : "重连中"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              成员 {memberCount} 人 · 邀请码 {board?.group.inviteCode ?? "--"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              className="w-full md:w-[180px]"
              onChange={(event) => setSelectedDate(event.target.value)}
              type="date"
              value={selectedDate}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {board?.members.map((member) => (
              <Card className="bg-white/95" key={member.user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{member.user.username}</CardTitle>
                    <Badge>
                      {member.completedCount}/{member.totalCount}
                    </Badge>
                  </div>
                  <CardDescription>
                    {member.totalCount === 0
                      ? "今日暂无计划"
                      : "完成越早，越容易保持节奏。"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {member.todos.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-border bg-secondary/40 px-4 py-8 text-sm text-muted-foreground">
                      今天还没有任务。
                    </div>
                  ) : (
                    member.todos.map((todo) => (
                      <div
                        className="rounded-[24px] border border-border bg-secondary/35 px-4 py-4"
                        key={todo.id}
                      >
                        <p
                          className={
                            todo.isDone
                              ? "text-sm text-muted-foreground line-through"
                              : "text-sm text-foreground"
                          }
                        >
                          {todo.content}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
