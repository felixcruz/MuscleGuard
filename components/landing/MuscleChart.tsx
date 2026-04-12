"use client";

import { useEffect, useRef, useState } from "react";

export function MuscleChart() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Chart dimensions
  const w = 480;
  const h = 220;
  const px = 40; // padding x
  const py = 24; // padding y
  const chartW = w - px * 2;
  const chartH = h - py * 2;

  // Months
  const months = ["Month 0", "Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"];
  const steps = months.length;

  // Data points (normalized 0-1, where 1 = top of chart)
  // Weight: both lines drop similarly
  const weightData = [0.95, 0.88, 0.80, 0.73, 0.65, 0.58, 0.52];

  // Muscle WITHOUT protection: drops significantly
  const muscleUnprotected = [0.85, 0.80, 0.72, 0.63, 0.55, 0.48, 0.40];

  // Muscle WITH MuscleGuard: stays mostly stable
  const muscleProtected = [0.85, 0.84, 0.83, 0.83, 0.82, 0.82, 0.81];

  function toPath(data: number[]): string {
    return data
      .map((val, i) => {
        const x = px + (i / (steps - 1)) * chartW;
        const y = py + (1 - val) * chartH;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }

  function pathLength(data: number[]): number {
    let len = 0;
    for (let i = 1; i < data.length; i++) {
      const x1 = px + ((i - 1) / (steps - 1)) * chartW;
      const y1 = py + (1 - data[i - 1]) * chartH;
      const x2 = px + (i / (steps - 1)) * chartW;
      const y2 = py + (1 - data[i]) * chartH;
      len += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    return Math.ceil(len);
  }

  const weightPath = toPath(weightData);
  const unprotectedPath = toPath(muscleUnprotected);
  const protectedPath = toPath(muscleProtected);

  const weightLen = pathLength(weightData);
  const unprotectedLen = pathLength(muscleUnprotected);
  const protectedLen = pathLength(muscleProtected);

  // End points for labels
  const lastIdx = steps - 1;
  const labelX = px + chartW + 8;
  const unprotectedEndY = py + (1 - muscleUnprotected[lastIdx]) * chartH;
  const protectedEndY = py + (1 - muscleProtected[lastIdx]) * chartH;
  const weightEndY = py + (1 - weightData[lastIdx]) * chartH;

  return (
    <div ref={ref} className="w-full max-w-xl mx-auto">
      <style>{`
        @keyframes mg-draw {
          from { stroke-dashoffset: var(--len); }
          to { stroke-dashoffset: 0; }
        }
        @keyframes mg-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .mg-line-weight {
          stroke-dasharray: ${weightLen};
          stroke-dashoffset: ${weightLen};
        }
        .mg-line-unprotected {
          stroke-dasharray: ${unprotectedLen};
          stroke-dashoffset: ${unprotectedLen};
        }
        .mg-line-protected {
          stroke-dasharray: ${protectedLen};
          stroke-dashoffset: ${protectedLen};
        }
        .mg-animate .mg-line-weight {
          animation: mg-draw 1.8s ease-out 0.2s forwards;
        }
        .mg-animate .mg-line-unprotected {
          animation: mg-draw 1.8s ease-out 0.4s forwards;
        }
        .mg-animate .mg-line-protected {
          animation: mg-draw 1.8s ease-out 0.6s forwards;
        }
        .mg-label {
          opacity: 0;
        }
        .mg-animate .mg-label {
          animation: mg-fade 0.5s ease-out 2.2s forwards;
        }
        .mg-animate .mg-label-delay {
          animation: mg-fade 0.5s ease-out 2.5s forwards;
        }
      `}</style>

      <svg
        viewBox={`0 0 ${w + 140} ${h + 20}`}
        className={`w-full h-auto ${visible ? "mg-animate" : ""}`}
        style={{ overflow: "visible" }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = py + pct * chartH;
          return (
            <line
              key={pct}
              x1={px}
              y1={y}
              x2={px + chartW}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          );
        })}

        {/* X axis labels */}
        {months.map((m, i) => {
          const x = px + (i / (steps - 1)) * chartW;
          return (
            <text
              key={m}
              x={x}
              y={h + 4}
              textAnchor="middle"
              fontSize={10}
              fill="rgba(255,255,255,0.25)"
            >
              {m}
            </text>
          );
        })}

        {/* Y axis labels */}
        <text x={px - 8} y={py + 4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.2)">High</text>
        <text x={px - 8} y={py + chartH + 4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.2)">Low</text>

        {/* Weight line (white, both scenarios) */}
        <path
          d={weightPath}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mg-line-weight"
        />

        {/* Muscle WITHOUT protection (alert) */}
        <path
          d={unprotectedPath}
          fill="none"
          stroke="#FFB4AB"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mg-line-unprotected"
        />

        {/* Muscle WITH MuscleGuard (lime) */}
        <path
          d={protectedPath}
          fill="none"
          stroke="#CDFF00"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mg-line-protected"
        />

        {/* End dots */}
        <circle cx={px + chartW} cy={unprotectedEndY} r={4} fill="#FFB4AB" className="mg-label" />
        <circle cx={px + chartW} cy={protectedEndY} r={4} fill="#CDFF00" className="mg-label" />
        <circle cx={px + chartW} cy={weightEndY} r={3} fill="rgba(255,255,255,0.3)" className="mg-label" />

        {/* Labels */}
        <text x={labelX} y={weightEndY + 4} fontSize={11} fill="rgba(255,255,255,0.35)" className="mg-label mg-label-delay">
          Weight
        </text>
        <text x={labelX} y={unprotectedEndY + 4} fontSize={11} fill="#FFB4AB" fontWeight={600} className="mg-label mg-label-delay">
          Muscle (no protection)
        </text>
        <text x={labelX} y={protectedEndY + 4} fontSize={11} fill="#CDFF00" fontWeight={600} className="mg-label mg-label-delay">
          Muscle (MuscleGuard)
        </text>
      </svg>
    </div>
  );
}
