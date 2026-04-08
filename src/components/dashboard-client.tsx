"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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
import { clearStoredToken, apiFetch } from "@/lib/api-client";
import { formatDisplayDate, todayDateString } from "@/lib/date";
import type {
  GroupListItem,
  GroupsResponse,
  TodoItem,
  TodosResponse,
} from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

type GroupMutationResponse = {
  group: GroupListItem;
};

export function DashboardClient() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [todoInput, setTodoInput] = useState("");
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTodo, setSavingTodo] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.isDone).length,
    [todos],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [todoResponse, groupsResponse] = await Promise.all([
        apiFetch<TodosResponse>(`/api/todos?date=${selectedDate}`),
        apiFetch<GroupsResponse>("/api/groups"),
      ]);

      setTodos(todoResponse.todos);
      setGroups(groupsResponse.groups);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleAddTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingTodo(true);
    setError(null);

    try {
      const response = await apiFetch<{ todo: TodoItem }>("/api/todos", {
        method: "POST",
        body: JSON.stringify({
          content: todoInput,
          targetDate: selectedDate,
        }),
      });

      setTodos((current) => [...current, response.todo]);
      setTodoInput("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "添加任务失败",
      );
    } finally {
      setSavingTodo(false);
    }
  }

  async function handleToggleTodo(todoId: string, isDone: boolean) {
    const previousTodos = todos;

    setTodos((current) =>
      current.map((todo) => (todo.id === todoId ? { ...todo, isDone } : todo)),
    );

    try {
      await apiFetch<{ todo: TodoItem }>(`/api/todos/${todoId}`, {
        method: "PATCH",
        body: JSON.stringify({ isDone }),
      });
    } catch (toggleError) {
      setTodos(previousTodos);
      setError(
        toggleError instanceof Error ? toggleError.message : "更新任务失败",
      );
    }
  }

  async function handleDeleteTodo(todoId: string) {
    const previousTodos = todos;

    setTodos((current) => current.filter((todo) => todo.id !== todoId));

    try {
      await apiFetch<{ success: true }>(`/api/todos/${todoId}`, {
        method: "DELETE",
      });
    } catch (deleteError) {
      setTodos(previousTodos);
      setError(
        deleteError instanceof Error ? deleteError.message : "删除任务失败",
      );
    }
  }

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingGroup(true);
    setError(null);

    try {
      const response = await apiFetch<GroupMutationResponse>("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: groupName }),
      });

      setGroups((current) => [response.group, ...current]);
      setGroupName("");
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "创建群组失败",
      );
    } finally {
      setCreatingGroup(false);
    }
  }

  async function handleJoinGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoiningGroup(true);
    setError(null);

    try {
      const response = await apiFetch<GroupMutationResponse>(
        "/api/groups/join",
        {
          method: "POST",
          body: JSON.stringify({ inviteCode }),
        },
      );

      setGroups((current) => {
        const exists = current.some((group) => group.id === response.group.id);
        return exists ? current : [response.group, ...current];
      });
      setInviteCode("");
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "加入群组失败");
    } finally {
      setJoiningGroup(false);
    }
  }

  function handleLogout() {
    clearStoredToken();
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 lg:px-10">
        <Card className="overflow-hidden bg-white/95">
          <CardContent className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Spring Todo</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                  你好，{user?.username}
                </h1>
                <Badge>{formatDisplayDate(selectedDate)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                今日已完成 {completedCount} / {todos.length}{" "}
                项，继续保持清爽的节奏。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                className="w-full md:w-[180px]"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
              <Button
                onClick={() => setSelectedDate(todayDateString())}
                variant="outline"
              >
                回到今天
              </Button>
              <Button onClick={handleLogout} variant="ghost">
                退出登录
              </Button>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <Card className="bg-white/95">
            <CardHeader>
              <CardTitle>个人待办</CardTitle>
              <CardDescription>
                支持按日期查看历史任务，勾选状态时会立即在界面中反馈。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form className="flex gap-3" onSubmit={handleAddTodo}>
                <Input
                  onChange={(event) => setTodoInput(event.target.value)}
                  placeholder="输入今天最重要的一件事"
                  required
                  value={todoInput}
                />
                <Button
                  disabled={savingTodo || !todoInput.trim()}
                  type="submit"
                >
                  {savingTodo ? <Spinner /> : "添加"}
                </Button>
              </form>

              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Spinner />
                </div>
              ) : todos.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border bg-secondary/40 px-5 py-10 text-center text-sm text-muted-foreground">
                  这一天还没有待办，先安排一个小目标吧。
                </div>
              ) : (
                <div className="space-y-3">
                  {todos.map((todo) => (
                    <div
                      className="flex items-center gap-3 rounded-[24px] border border-border bg-secondary/35 px-4 py-4"
                      key={todo.id}
                    >
                      <input
                        checked={todo.isDone}
                        className="h-4 w-4 accent-[var(--primary)]"
                        onChange={(event) =>
                          handleToggleTodo(todo.id, event.target.checked)
                        }
                        type="checkbox"
                      />
                      <div className="min-w-0 flex-1">
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
                      <Button
                        onClick={() => handleDeleteTodo(todo.id)}
                        size="sm"
                        variant="ghost"
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-white/95">
              <CardHeader>
                <CardTitle>创建群组</CardTitle>
                <CardDescription>
                  生成邀请码后，朋友可快速加入并实时互相监督。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={handleCreateGroup}>
                  <Input
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="例如：晨间打卡小队"
                    required
                    value={groupName}
                  />
                  <Button
                    className="w-full"
                    disabled={creatingGroup}
                    type="submit"
                  >
                    {creatingGroup ? <Spinner /> : "创建群组"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-white/95">
              <CardHeader>
                <CardTitle>加入群组</CardTitle>
                <CardDescription>
                  输入邀请码即可加入已有监督小组。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={handleJoinGroup}>
                  <Input
                    onChange={(event) =>
                      setInviteCode(event.target.value.toUpperCase())
                    }
                    placeholder="输入邀请码"
                    required
                    value={inviteCode}
                  />
                  <Button
                    className="w-full"
                    disabled={joiningGroup}
                    type="submit"
                    variant="outline"
                  >
                    {joiningGroup ? <Spinner /> : "加入群组"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-white/95">
              <CardHeader>
                <CardTitle>我的群组</CardTitle>
                <CardDescription>
                  点击进入群组详情，查看所有成员当日进度。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {groups.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-border bg-secondary/40 px-5 py-8 text-sm text-muted-foreground">
                    还没有加入任何群组。
                  </div>
                ) : (
                  groups.map((group) => (
                    <Link
                      className="block rounded-[24px] border border-border bg-secondary/35 px-4 py-4 transition hover:border-primary/40 hover:bg-primary/5"
                      href={`/groups/${group.id}`}
                      key={group.id}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {group.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            邀请码 {group.inviteCode} · {group.memberCount} 人
                          </p>
                        </div>
                        <Badge>进入</Badge>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
