"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardClient } from "@/components/dashboard-client";
import { SakuraPetals } from "@/components/sakura-petals";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Celebration } from "@/components/celebration";
import { apiFetch } from "@/lib/api-client";
import type { TodoItem } from "@/lib/types";

type ExpiredTodosResponse = {
  expiredTodos: TodoItem[];
};

export default function DashboardPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expiredTodos, setExpiredTodos] = useState<TodoItem[]>([]);
  const [expiredLoading, setExpiredLoading] = useState(true);
  const [expiredPanelOpen, setExpiredPanelOpen] = useState(false);
  const [expiredActionLoading, setExpiredActionLoading] = useState(false);

  const expiredCountLabel = useMemo(() => {
    if (expiredTodos.length === 1) {
      return "有 1 条过期待处理任务";
    }

    return `有 ${expiredTodos.length} 条过期待处理任务`;
  }, [expiredTodos.length]);

  const getOverdueDays = useCallback((targetDate: string) => {
    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const todoDate = new Date(`${targetDate}T12:00:00`);
    const todoDay = new Date(
      todoDate.getFullYear(),
      todoDate.getMonth(),
      todoDate.getDate(),
    );
    const diff = todayDate.getTime() - todoDay.getTime();

    return Math.max(1, Math.floor(diff / 86400000));
  }, []);

  const loadExpiredTodos = useCallback(async () => {
    setExpiredLoading(true);

    try {
      const data = await apiFetch<ExpiredTodosResponse>("/api/todos/expired");
      setExpiredTodos(data.expiredTodos);
    } catch (error) {
    } finally {
      setExpiredLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExpiredTodos();
  }, [loadExpiredTodos]);

  async function handleExpiredAction(
    action: "moveToToday" | "delete",
    todoIds: string[],
  ) {
    if (todoIds.length === 0) {
      return;
    }

    setExpiredActionLoading(true);

    try {
      await apiFetch("/api/todos/expired", {
        method: "POST",
        body: JSON.stringify({ action, todoIds }),
      });
      setExpiredTodos((current) =>
        current.filter((todo) => !todoIds.includes(todo.id)),
      );
      setRefreshTrigger((current) => current + 1);
    } catch (error) {
    } finally {
      setExpiredActionLoading(false);
    }
  }

  return (
    <AuthGuard>
      <SakuraPetals />
      <DashboardClient
        todos={todos}
        setTodos={setTodos}
        loading={dataLoading}
        refreshTrigger={refreshTrigger}
        expiredTodoCount={expiredTodos.length}
        onOpenExpiredAssistant={() => setExpiredPanelOpen(true)}
        setLoading={setDataLoading}
      />
      {!expiredLoading && expiredTodos.length > 0 && (
        <Dialog open={expiredPanelOpen} onOpenChange={setExpiredPanelOpen}>
          <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
            <DialogClose />
            <DialogHeader>
              <DialogTitle>{expiredCountLabel}</DialogTitle>
              <DialogDescription>
                支持放弃删除或加入今天，可单条和批量处理。
              </DialogDescription>
            </DialogHeader>

            {expiredTodos.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  className="rounded-xl border border-amber-300/60 bg-[linear-gradient(135deg,#f59e0b,#ea580c)] text-white shadow-md shadow-amber-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-300/70"
                  disabled={expiredActionLoading}
                  onClick={() =>
                    handleExpiredAction(
                      "moveToToday",
                      expiredTodos.map((todo) => todo.id),
                    )
                  }
                  size="sm"
                  type="button"
                >
                  {expiredActionLoading ? <Spinner /> : "✨ 全部加入今天"}
                </Button>
                <Button
                  className="rounded-xl border-rose-200 bg-white text-rose-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md hover:shadow-rose-100"
                  disabled={expiredActionLoading}
                  onClick={() =>
                    handleExpiredAction(
                      "delete",
                      expiredTodos.map((todo) => todo.id),
                    )
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {expiredActionLoading ? <Spinner /> : "🗑 全部放弃"}
                </Button>
              </div>
            )}

            <div className="mt-2 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {expiredTodos.map((todo) => (
                <div
                  className="group flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50/70 p-4"
                  key={todo.id}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                        {todo.category === "WORK" ? "💼 工作" : "🏠 个人"}
                      </span>
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-700">
                        已过期 {getOverdueDays(todo.targetDate)} 天
                      </span>
                    </div>
                    <p className="text-sm text-slate-900">{todo.content}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-amber-300/60 bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-sm font-medium text-white shadow-sm shadow-amber-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-300/80"
                      disabled={expiredActionLoading}
                      onClick={() =>
                        handleExpiredAction("moveToToday", [todo.id])
                      }
                      type="button"
                    >
                      {expiredActionLoading ? <Spinner /> : "加入今天"}
                    </button>
                    <button
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 shadow-sm shadow-rose-100/80 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md hover:shadow-rose-100"
                      disabled={expiredActionLoading}
                      onClick={() => handleExpiredAction("delete", [todo.id])}
                      type="button"
                    >
                      {expiredActionLoading ? <Spinner /> : "放弃"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Celebration todos={todos} loading={dataLoading} />
    </AuthGuard>
  );
}
