"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { todayDateString } from "@/lib/date";

export function Celebration({
  todos,
  loading,
}: {
  todos: { isDone: boolean; targetDate: string }[];
  loading: boolean;
}) {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);
  const showRef = useRef(false);
  const prevCompletedRef = useRef(false);

  const celebrate = useCallback(() => {
    setShow(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimate(true);
      });
    });

    setTimeout(() => {
      setAnimate(false);
      setTimeout(() => {
        setShow(false);
        showRef.current = false;
      }, 600);
    }, 2500);
  }, []);

  useEffect(() => {
    if (loading || todos.length === 0) return;

    const today = todayDateString();
    const isTodayTodos = todos.every((todo) => todo.targetDate === today);
    const allCompleted = todos.every((todo) => todo.isDone);
    const shouldCelebrate =
      isTodayTodos && allCompleted && !prevCompletedRef.current;

    if (shouldCelebrate && !showRef.current) {
      prevCompletedRef.current = true;
      showRef.current = true;
      queueMicrotask(() => celebrate());
    } else if (!allCompleted || !isTodayTodos) {
      prevCompletedRef.current = false;
    }
  }, [todos, loading, celebrate]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at center, rgba(110, 174, 123, 0.15) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(255, 255, 255, 1) 100%)",
        zIndex: 200,
        overflow: "hidden",
      }}
    >
      <div
        className={animate ? "celebration-emoji" : ""}
        style={{
          fontSize: "180px",
          lineHeight: 1,
          filter: "drop-shadow(0 10px 40px rgba(110, 174, 123, 0.4))",
          userSelect: "none",
        }}
      >
        👍
      </div>
      <div
        className={animate ? "celebration-text" : ""}
        style={{
          marginTop: "30px",
          fontSize: "56px",
          fontWeight: 800,
          background: "linear-gradient(135deg, #6eae7b 0%, #4ade80 50%, #22c55e 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: "none",
          filter: "drop-shadow(0 4px 12px rgba(110, 174, 123, 0.3))",
          userSelect: "none",
        }}
      >
        你真棒！
      </div>
      <div
        className={animate ? "celebration-subtext" : ""}
        style={{
          marginTop: "16px",
          fontSize: "18px",
          color: "#6a7d6d",
          fontWeight: 500,
          userSelect: "none",
        }}
      >
        所有任务已完成，继续保持！
      </div>
    </div>
  );
}
