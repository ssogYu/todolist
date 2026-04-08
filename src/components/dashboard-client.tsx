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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  const [noteInput, setNoteInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"WORK" | "PERSONAL">(
    "WORK",
  );
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>();
  const [loading, setLoading] = useState(true);
  const [savingTodo, setSavingTodo] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);

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
          note: noteInput || undefined,
          category: selectedCategory,
          targetDate: selectedDate,
        }),
      });

      setTodos((current) => [...current, response.todo]);
      setTodoInput("");
      setNoteInput("");
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
      <Button
        className="fixed bottom-6 right-6 z-50 shadow-lg"
        onClick={() => setGroupPanelOpen(true)}
        size="lg"
      >
        群组管理
      </Button>
      <Dialog open={groupPanelOpen} onOpenChange={setGroupPanelOpen}>
        <DialogContent>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>群组管理</DialogTitle>
            <DialogDescription>创建或加入群组</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">创建群组</h3>
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
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">加入群组</h3>
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
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">我的群组</h3>
              {groups.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border bg-secondary/40 px-5 py-8 text-sm text-muted-foreground">
                  还没有加入任何群组。
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 md:px-8 lg:px-10">
        <Card className="overflow-hidden bg-white/95">
          <CardContent className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Todo List</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                  你好，{user?.username}
                </h1>
                <Badge>{formatDisplayDate(selectedDate)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                今日已完成 {completedCount} / {todos.length} 项，继续加油哦～。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                className="w-full md:w-[180px]"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
              <Button onClick={handleLogout} variant="ghost">
                退出登录
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="bg-white/95">
            <CardHeader>
              <CardTitle>待办事项</CardTitle>
              <CardDescription>支持按日期查看历史任务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form className="space-y-3" onSubmit={handleAddTodo}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    className="flex-1"
                    onChange={(event) => setTodoInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && todoInput.trim()) {
                        event.preventDefault();
                        const form = event.currentTarget.form;
                        if (form) {
                          const submitEvent = new SubmitEvent("submit", {
                            bubbles: true,
                            cancelable: true,
                          });
                          form.dispatchEvent(submitEvent);
                        }
                      }
                    }}
                    placeholder="输入待办事项，按回车 快速添加"
                    required
                    value={todoInput}
                  />
                  <Select
                    className="sm:w-[130px] "
                    onChange={(event) =>
                      setSelectedCategory(
                        event.target.value as "WORK" | "PERSONAL",
                      )
                    }
                    options={[
                      { value: "WORK", label: "💼 工作" },
                      { value: "PERSONAL", label: "🏠 个人" },
                    ]}
                    value={selectedCategory}
                  />
                  <Button
                    disabled={savingTodo || !todoInput.trim()}
                    type="submit"
                    className="w-full sm:w-24"
                  >
                    {savingTodo ? <Spinner /> : "✨ 添加"}
                  </Button>
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors list-none">
                    <span className="text-xs">+ 添加备注</span>
                  </summary>
                  <Input
                    className="mt-2"
                    onChange={(event) => setNoteInput(event.target.value)}
                    placeholder="添加备注信息..."
                    value={noteInput}
                  />
                </details>
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
                <div className="grid gap-6 sm:grid-cols-2">
                  {(["PERSONAL", "WORK"] as const).map((cat) => {
                    const filtered = todos.filter((t) => t.category === cat);
                    return (
                      <div key={cat} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">
                            {cat === "WORK" ? "工作" : "个人"}
                          </h3>
                          <Badge variant="secondary">{filtered.length}</Badge>
                        </div>
                        {filtered.length === 0 ? (
                          <div className="rounded-[24px] border border-dashed border-border bg-secondary/40 px-5 py-8 text-sm text-muted-foreground">
                            暂无{cat === "WORK" ? "工作" : "个人"}待办
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filtered.map((todo) => (
                              <div
                                className="group flex items-start gap-3 rounded-[24px] border border-border bg-secondary/35 px-4 py-4 transition-all duration-150 hover:border-destructive/30 hover:bg-destructive/5"
                                key={todo.id}
                              >
                                <input
                                  checked={todo.isDone}
                                  className="mt-0.5 h-5 w-5 rounded-md border border-border accent-[var(--primary)] shadow-sm transition-all duration-150 hover:scale-[1.02]"
                                  onChange={(event) =>
                                    handleToggleTodo(
                                      todo.id,
                                      event.target.checked,
                                    )
                                  }
                                  type="checkbox"
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p
                                    className={
                                      todo.isDone
                                        ? "text-sm text-muted-foreground line-through"
                                        : "text-sm text-foreground"
                                    }
                                  >
                                    {todo.content}
                                  </p>
                                  {todo.note && (
                                    <p className="text-xs text-muted-foreground">
                                      📝 {todo.note}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                  onClick={() => handleDeleteTodo(todo.id)}
                                  size="sm"
                                  variant="ghost"
                                >
                                  🗑️
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
