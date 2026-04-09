"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardClient } from "@/components/dashboard-client";
import { SakuraPetals } from "@/components/sakura-petals";
import { Celebration } from "@/components/celebration";
import type { TodoItem } from "@/lib/types";

export default function DashboardPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  return (
    <AuthGuard>
      <SakuraPetals />
      <DashboardClient
        todos={todos}
        setTodos={setTodos}
        loading={dataLoading}
        setLoading={setDataLoading}
      />
      <Celebration todos={todos} loading={dataLoading} />
    </AuthGuard>
  );
}
