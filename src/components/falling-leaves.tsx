"use client";

import { useMemo } from "react";

interface FallingItem {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  type: "leaf" | "petal";
  sway: number;
  opacity: number;
}

const leafEmojis = ["🍃", "🍂", "🌿"];
const petalEmojis = ["🌸", "💮", "✿", "❀", "🏵️"];

function generateFallingItems(): FallingItem[] {
  const result: FallingItem[] = [];
  for (let i = 0; i < 25; i++) {
    const isLeaf = i % 4 !== 0;
    result.push({
      id: i,
      x: (i * 4.1) % 100,
      size: 12 + ((i * 5) % 18),
      duration: 12 + ((i * 3) % 12),
      delay: i * 0.6,
      rotation: (i * 53) % 360,
      type: isLeaf ? "leaf" : "petal",
      sway: ((i * 11) % 80) - 40,
      opacity: 0.6 + (i % 3) * 0.1,
    });
  }
  return result;
}

function FallingLeaf({ item }: { item: FallingItem }) {
  const emoji =
    item.type === "leaf"
      ? leafEmojis[item.id % leafEmojis.length]
      : petalEmojis[item.id % petalEmojis.length];

  return (
    <span
      className="falling-item"
      style={
        {
          "--x": `${item.x}%`,
          "--size": `${item.size}px`,
          "--duration": `${item.duration}s`,
          "--delay": `${item.delay}s`,
          "--rotation": `${item.rotation}deg`,
          "--sway": `${item.sway}px`,
          "--opacity": item.opacity,
        } as React.CSSProperties
      }
    >
      {emoji}
    </span>
  );
}

export function FallingLeaves() {
  const items = useMemo(() => generateFallingItems(), []);

  return (
    <div className="falling-leaves-container">
      {items.map((item) => (
        <FallingLeaf key={item.id} item={item} />
      ))}
    </div>
  );
}
