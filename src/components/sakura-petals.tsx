"use client";

import { useMemo } from "react";

interface Petal {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  sway: number;
  opacity: number;
  verticalSway: number;
}

const petalEmojis = ["🌸", "💮", "🌺", "🌷", "✿"];

function generatePetals(count: number = 14): Petal[] {
  const result: Petal[] = [];
  const petalDistribution = [
    0, 8, 3, 12, 6, 1, 10, 5, 14, 2, 9, 4, 11, 7, 13
  ];

  for (let i = 0; i < count; i++) {
    const idx = petalDistribution[i % petalDistribution.length];
    result.push({
      id: i,
      x: 3 + (idx * 6.8) % 94,
      size: 10 + (idx * 3) % 6,
      duration: 16 + (idx * 5) % 10,
      delay: idx * 1.1,
      rotation: (idx * 47) % 360,
      sway: 30 + (idx * 7) % 25,
      opacity: 0.45 + (idx * 0.08) % 0.25,
      verticalSway: 15 + (idx * 11) % 20,
    });
  }
  return result;
}

function PetalItem({ petal }: { petal: Petal }) {
  const emoji = petalEmojis[petal.id % petalEmojis.length];

  return (
    <span
      className="petal-item"
      style={
        {
          "--petal-x": `${petal.x}%`,
          "--petal-size": `${petal.size}px`,
          "--petal-duration": `${petal.duration}s`,
          "--petal-delay": `${petal.delay}s`,
          "--petal-rotation": `${petal.rotation}deg`,
          "--petal-sway": `${petal.sway}px`,
          "--petal-opacity": petal.opacity,
          "--petal-vertical-sway": `${petal.verticalSway}px`,
        } as React.CSSProperties
      }
    >
      {emoji}
    </span>
  );
}

export function SakuraPetals() {
  const petals = useMemo(() => generatePetals(14), []);

  return (
    <div className="sakura-container">
      {petals.map((petal) => (
        <PetalItem key={petal.id} petal={petal} />
      ))}
    </div>
  );
}
