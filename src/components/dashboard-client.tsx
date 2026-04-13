"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { isBeforeToday, todayDateString } from "@/lib/date";
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

interface DashboardClientProps {
  todos: TodoItem[];
  setTodos: React.Dispatch<React.SetStateAction<TodoItem[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refreshTrigger?: number;
  expiredTodoCount?: number;
  onOpenExpiredAssistant?: () => void;
}

export function DashboardClient({
  todos,
  setTodos,
  loading,
  setLoading,
  refreshTrigger,
  expiredTodoCount = 0,
  onOpenExpiredAssistant,
}: DashboardClientProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [todoInput, setTodoInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"WORK" | "PERSONAL">(
    "WORK",
  );
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [savingTodo, setSavingTodo] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editInput, setEditInput] = useState("");
  const [editNoteInput, setEditNoteInput] = useState("");

  const [greeting, setGreeting] = useState("你好");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("早上好");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("下午好");
    } else {
      setGreeting("晚上好");
    }
  }, []);

  const motivationalQuotes = [
    "专注当下，一步一步完成目标",
    "小步快跑，持续迭代",
    "今日事，今日毕",
    "保持节奏，遇见更好的自己",
    "每一项完成都是进步的印记",
    "效率是慢慢提升的",
    "认真对待每一天的待办",
    "成长路上，你并不孤单",
    "完成比完美更重要",
    "坚持就是胜利",
    "不积跬步，无以至千里",
    "路虽远，行则将至",
    "事虽小，做则必成",
    "千里之行，始于足下",
    "绳锯木断，水滴石穿",
    "锲而不舍，金石可镂",
    "博观而约取，厚积而薄发",
    "学如逆水行舟，不进则退",
    "书山有路勤为径，学海无涯苦作舟",
    "业精于勤，荒于嬉",
    "行成于思，毁于随",
    "青，取之于蓝而青于蓝",
    "冰，水为之而寒于水",
    "长风破浪会有时，直挂云帆济沧海",
    "会当凌绝顶，一览众山小",
    "欲穷千里目，更上一层楼",
    "宝剑锋从磨砺出，梅花香自苦寒来",
    "纸上得来终觉浅，绝知此事要躬行",
    "问渠那得清如许，为有源头活水来",
    "人生得意须尽欢，莫使金樽空对月",
    "天生我材必有用，千金散尽还复来",
    "两岸猿声啼不住，轻舟已过万重山",
    "山重水复疑无路，柳暗花明又一村",
    "沉舟侧畔千帆过，病树前头万木春",
    "落霞与孤鹜齐飞，秋水共长天一色",
    "采菊东篱下，悠然见南山",
    "竹外桃花三两枝，春江水暖鸭先知",
    "春眠不觉晓，处处闻啼鸟",
    "随风潜入夜，润物细无声",
    "好雨知时节，当春乃发生",
    "野火烧不尽，春风吹又生",
    "明月松间照，清泉石上流",
    "大漠孤烟直，长河落日圆",
    "海内存知己，天涯若比邻",
    "桃花潭水深千尺，不及汪伦送我情",
    "海阔凭鱼跃，天高任鸟飞",
    "少年易老学难成，一寸光阴不可轻",
    "及时当勉励，岁月不待人",
    "盛年不重来，一日难再晨",
  ];

  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [motivationalQuotes.length]);

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.isDone).length,
    [todos],
  );

  const progressPercent = useMemo(() => {
    if (todos.length === 0) return 0;
    return Math.round((completedCount / todos.length) * 100);
  }, [completedCount, todos.length]);
  const isPastSelectedDate = useMemo(
    () => isBeforeToday(selectedDate),
    [selectedDate],
  );
  const operationLockedMessage = "今日之前的日期仅支持查看，不能新增或修改任务";
  const editingTodoLocked = editingTodo
    ? isBeforeToday(editingTodo.targetDate)
    : false;

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const [todoResponse, groupsResponse] = await Promise.all([
        apiFetch<TodosResponse>(`/api/todos?date=${selectedDate}`),
        apiFetch<GroupsResponse>("/api/groups"),
      ]);

      setTodos(todoResponse.todos);
      setGroups(groupsResponse.groups);
    } catch (loadError) {
    } finally {
      setLoading(false);
    }
  }, [selectedDate, setLoading, setTodos]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard, refreshTrigger]);

  async function handleAddTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPastSelectedDate) {
      return;
    }
    setSavingTodo(true);

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
    } finally {
      setSavingTodo(false);
    }
  }

  async function handleToggleTodo(todoId: string, isDone: boolean) {
    const currentTodo = todos.find((todo) => todo.id === todoId);
    if (!currentTodo || isBeforeToday(currentTodo.targetDate)) {
      return;
    }
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
    }
  }

  async function handleUpdateTodo(
    todoId: string,
    content: string,
    note?: string,
  ) {
    const currentTodo = todos.find((todo) => todo.id === todoId);
    if (!currentTodo || isBeforeToday(currentTodo.targetDate)) {
      setEditingTodo(null);
      return;
    }
    const previousTodos = todos;

    setTodos((current) =>
      current.map((todo) =>
        todo.id === todoId
          ? { ...todo, content, ...(note !== undefined ? { note } : {}) }
          : todo,
      ),
    );
    setEditingTodo(null);

    try {
      await apiFetch<{ todo: TodoItem }>(`/api/todos/${todoId}`, {
        method: "PATCH",
        body: JSON.stringify({
          content,
          ...(note !== undefined ? { note } : {}),
        }),
      });
    } catch (updateError) {
      setTodos(previousTodos);
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
    }
  }

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingGroup(true);

    try {
      const response = await apiFetch<GroupMutationResponse>("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: groupName }),
      });

      setGroups((current) => [response.group, ...current]);
      setGroupName("");
    } catch (createError) {
    } finally {
      setCreatingGroup(false);
    }
  }

  async function handleJoinGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoiningGroup(true);

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
    <div className="min-h-screen bg-page relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary/3 via-primary/1 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none opacity-50" />

      <Button
        className="fixed bottom-8 right-8 z-50 shadow-xl shadow-primary/10 rounded-full px-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-0.5"
        onClick={() => setGroupPanelOpen(true)}
      >
        <svg
          className="w-5 h-5 mr-2"
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
        群组
      </Button>

      <Dialog open={groupPanelOpen} onOpenChange={setGroupPanelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogClose />
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              群组管理
            </DialogTitle>
            <DialogDescription>创建或加入群组，开始协作</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80">
                创建群组
              </h3>
              <form className="space-y-3" onSubmit={handleCreateGroup}>
                <Input
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="例如：晨间打卡小队"
                  required
                  value={groupName}
                  className="rounded-xl"
                />
                <Button
                  className="w-full rounded-xl"
                  disabled={creatingGroup}
                  type="submit"
                >
                  {creatingGroup ? <Spinner /> : "创建群组"}
                </Button>
              </form>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs text-muted-foreground">
                  或
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80">
                加入群组
              </h3>
              <form className="space-y-3" onSubmit={handleJoinGroup}>
                <Input
                  onChange={(event) =>
                    setInviteCode(event.target.value.toUpperCase())
                  }
                  placeholder="输入邀请码"
                  required
                  value={inviteCode}
                  className="rounded-xl"
                />
                <Button
                  className="w-full rounded-xl"
                  disabled={joiningGroup}
                  type="submit"
                  variant="outline"
                >
                  {joiningGroup ? <Spinner /> : "加入群组"}
                </Button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80">
                我的群组
              </h3>
              {groups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-secondary/20 py-10 text-center">
                  <div className="text-3xl mb-2">🌿</div>
                  <p className="text-sm text-muted-foreground">
                    还没有加入任何群组
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <Link
                      className="group flex items-center justify-between rounded-xl border border-border/50 bg-card/80 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
                      href={`/groups/${group.id}`}
                      key={group.id}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-lg">
                          🌱
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">
                            {group.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {group.inviteCode} · {group.memberCount} 人
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-primary/70 group-hover:text-primary transition-colors">
                        进入
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingTodo !== null}
        onOpenChange={() => setEditingTodo(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogClose />
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              编辑任务
            </DialogTitle>
            <DialogDescription>
              {editingTodoLocked
                ? operationLockedMessage
                : "修改任务内容和备注"}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (editingTodo && editInput.trim()) {
                const trimmedNote = editNoteInput.trim();
                handleUpdateTodo(
                  editingTodo.id,
                  editInput.trim(),
                  trimmedNote ? trimmedNote : undefined,
                );
              }
            }}
          >
            <div className="space-y-2">
              <Input
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                placeholder="任务内容"
                required
                className="rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
                disabled={editingTodoLocked}
              />
              <textarea
                value={editNoteInput}
                onChange={(e) => setEditNoteInput(e.target.value)}
                placeholder="备注（可选）"
                className="w-full rounded-xl border border-border/50 bg-secondary/20 px-4 py-3 text-sm resize-none min-h-[80px] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={editingTodoLocked}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setEditingTodo(null)}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                disabled={editingTodoLocked || !editInput.trim()}
              >
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="relative mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <header className="mb-6 flex items-start justify-between">
          <div className="space-y-1">
            {/* <div className="flex items-center gap-2 text-sm font-medium text-primary/80">
              <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
              Todo List
            </div> */}
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              <span className="text-foreground/90">{greeting}，</span>
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {user?.username}
              </span>
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-md">
              <span className="relative inline-block overflow-hidden">
                <span key={quoteIndex} className="inline-block animate-fade-in">
                  {motivationalQuotes[quoteIndex]}
                </span>
              </span>
            </p>
          </div>

          <div className="relative group">
            {expiredTodoCount > 0 && onOpenExpiredAssistant && (
              <button
                className="absolute -right-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-amber-100 bg-[linear-gradient(135deg,#f59e0b,#ea580c)] text-xs font-bold text-white shadow-[0_12px_28px_rgba(234,88,12,0.55)] transition-all duration-300 [animation:warning-bounce_0.75s_cubic-bezier(0.34,1.56,0.64,1)_infinite,warning-glow_1.2s_ease-in-out_infinite] hover:scale-110 hover:shadow-[0_16px_32px_rgba(234,88,12,0.75)]"
                onClick={onOpenExpiredAssistant}
                type="button"
              >
                <span className="absolute -inset-1 -z-10 rounded-full bg-amber-300/60 [animation:warning-ring-blast_0.95s_ease-out_infinite]" />
                <span className="absolute -inset-2 -z-20 rounded-full border border-orange-300/60 [animation:warning-ring-blast_1.15s_ease-out_infinite] [animation-delay:180ms]" />
                <span className="absolute inset-0 rounded-full [animation:warning-flash_1.1s_ease-in-out_infinite]" />
                <span className="[animation:warning-shake_0.7s_ease-in-out_infinite,warning-pop_0.7s_ease-in-out_infinite]">
                  !
                </span>
                <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-none text-white">
                  {expiredTodoCount > 99 ? "99+" : expiredTodoCount}
                </span>
              </button>
            )}
            <div className="flex items-center gap-2.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 px-4 py-2 cursor-pointer transition-all duration-300 hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm text-primary-foreground font-semibold shadow-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{user?.username}</span>
            </div>
            <div className="absolute right-0 top-full mt-2 min-w-[140px] rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm shadow-xl shadowforeground/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0">
              <button
                className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                onClick={handleLogout}
              >
                退出登录
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-8">
          <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 shadow-xl shadowforeground/5">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">今日待办</h2>
                <div className="flex items-center gap-2">
                  <Input
                    className="w-[130px] md:w-[150px] h-9 text-sm bg-secondary/30 border-0 rounded-lg"
                    onChange={(event) => setSelectedDate(event.target.value)}
                    type="date"
                    value={selectedDate}
                  />
                  <span className="text-xs text-muted-foreground">
                    {selectedDate === todayDateString()
                      ? "今天"
                      : new Date(selectedDate).toLocaleDateString("zh-CN", {
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        })}
                  </span>
                </div>
              </div>
              {todos.length > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {completedCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    / {todos.length} 已完成
                  </div>
                </div>
              )}
            </div>

            {todos.length > 0 && (
              <div className="mb-6 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            <form className="mb-6 space-y-3" onSubmit={handleAddTodo}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    className="h-12 w-full rounded-xl border border-border/50 bg-secondary/20 pl-12 pr-4 text-sm transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    onChange={(event) => setTodoInput(event.target.value)}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        todoInput.trim() &&
                        !isComposing
                      ) {
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
                    placeholder="添加新的待办..."
                    required
                    value={todoInput}
                    disabled={isPastSelectedDate}
                  />
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <Select
                  className="sm:w-[120px] h-12"
                  onChange={(event) =>
                    setSelectedCategory(
                      event.target.value as "WORK" | "PERSONAL",
                    )
                  }
                  options={[
                    { value: "PERSONAL", label: "🏠 个人" },
                    { value: "WORK", label: "💼 工作" },
                  ]}
                  value={selectedCategory}
                  disabled={isPastSelectedDate}
                />
                <Button
                  disabled={
                    isPastSelectedDate || savingTodo || !todoInput.trim()
                  }
                  type="submit"
                  className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                >
                  {savingTodo ? <Spinner /> : "添加"}
                </Button>
              </div>
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-1">
                  <span className="text-xs">+ 添加备注</span>
                </summary>
                <input
                  className="mt-2 h-10 w-full rounded-lg border border-border/50 bg-secondary/20 px-4 text-sm transition-all duration-200 focus:border-primary/50 focus:bg-secondary/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  onChange={(event) => setNoteInput(event.target.value)}
                  placeholder="添加备注信息..."
                  value={noteInput}
                  disabled={isPastSelectedDate}
                />
              </details>
            </form>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : todos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/50 bg-secondary/10 py-16 text-center">
                <div className="text-5xl mb-4">🌸</div>
                <p className="text-base font-medium text-foreground/70">
                  还没有待办事项
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  开始添加你的第一个目标吧
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {(["PERSONAL", "WORK"] as const).map((cat) => {
                  const filtered = todos.filter((t) => t.category === cat);
                  return (
                    <div key={cat} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {cat === "WORK" ? "💼" : "🏠"}
                        </span>
                        <h3 className="text-sm font-semibold">
                          {cat === "WORK" ? "工作" : "个人"}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2 py-0.5 text-xs"
                        >
                          {filtered.length}
                        </Badge>
                      </div>
                      {filtered.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/50 bg-secondary/10 py-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            暂无{cat === "WORK" ? "工作" : "个人"}待办
                          </p>
                        </div>
                      ) : (
                        <div
                          className="space-y-2 overflow-y-auto"
                          style={{ maxHeight: "500px" }}
                        >
                          {filtered.map((todo) => {
                            const isTodoLocked = isBeforeToday(todo.targetDate);
                            return (
                              <div
                                className={`group flex items-start gap-3 rounded-xl border border-border/50 bg-card/80 p-4 transition-all duration-200 ${
                                  isTodoLocked
                                    ? "opacity-75"
                                    : "hover:border-primary/30 hover:bg-card hover:shadow-md hover:shadow-primary/5"
                                }`}
                                key={todo.id}
                              >
                                <label className="relative flex items-center justify-center">
                                  <input
                                    checked={todo.isDone}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-primary/30 transition-all duration-200 checked:border-primary checked:bg-primary checked:shadow-sm checked:shadow-primary/30 hover:border-primary/50 peer-hover:border-primary disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary/40 disabled:opacity-60"
                                    onChange={(event) =>
                                      handleToggleTodo(
                                        todo.id,
                                        event.target.checked,
                                      )
                                    }
                                    type="checkbox"
                                    disabled={isTodoLocked}
                                  />
                                  <svg
                                    className="pointer-events-none absolute opacity-0 peer-checked:opacity-100 transition-opacity"
                                    fill="none"
                                    stroke="white"
                                    viewBox="0 0 24 24"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </label>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p
                                    className={
                                      todo.isDone
                                        ? "text-sm text-muted-foreground line-through decoration-primary/30"
                                        : "text-sm text-foreground"
                                    }
                                  >
                                    {todo.content}
                                  </p>
                                  {todo.note && (
                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <span>📝</span> {todo.note}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
                                      isTodoLocked
                                        ? "cursor-not-allowed text-muted-foreground/40 opacity-60"
                                        : "text-muted-foreground/50 opacity-0 hover:bg-blue-50 hover:text-blue-500 group-hover:opacity-100"
                                    }`}
                                    onClick={() => {
                                      setEditingTodo(todo);
                                      setEditInput(todo.content);
                                      setEditNoteInput(todo.note || "");
                                    }}
                                    type="button"
                                    disabled={isTodoLocked}
                                  >
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
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
                                      isTodoLocked
                                        ? "cursor-not-allowed text-muted-foreground/40 opacity-60"
                                        : "text-muted-foreground/50 opacity-0 hover:bg-blue-50 hover:text-blue-500 group-hover:opacity-100"
                                    }`}
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    type="button"
                                    disabled={isTodoLocked}
                                  >
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
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
          <span>专注</span>
          <span className="inline-block h-1 w-1 rounded-full bg-primary" />
          <span>高效</span>
          <span className="inline-block h-1 w-1 rounded-full bg-primary" />
          <span>成长</span>
        </footer>
      </div>
    </div>
  );
}
