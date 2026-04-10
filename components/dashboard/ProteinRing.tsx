"use client";

interface Props {
  goalG: number;
  loggedG: number;
}

function getRingState(pct: number) {
  if (pct >= 0.9) return { color: "#16a34a", trackColor: "#dcfce7", label: "Goal reached! ✓" };
  if (pct >= 0.51) return { color: "#4ade80", trackColor: "#f0fdf4", label: "Almost there" };
  if (pct >= 0.26) return { color: "#f59e0b", trackColor: "#fffbeb", label: "On track" };
  return { color: "#d1d5db", trackColor: "#f3f4f6", label: "Get started" };
}

export function ProteinRing({ goalG, loggedG }: Props) {
  const pct = goalG > 0 ? Math.min(1, loggedG / goalG) : 0;
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference * (1 - pct);
  const remaining = Math.max(0, goalG - loggedG);
  const { color, trackColor, label } = getRingState(pct);
  const labelColor = color === "#d1d5db" ? "#9ca3af" : color;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx={radius} cy={radius} r={normalizedRadius} fill="none" stroke={trackColor} strokeWidth={stroke} />
          {/* Progress */}
          <circle
            cx={radius} cy={radius} r={normalizedRadius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {pct >= 0.9 ? (
            <span className="text-4xl">✓</span>
          ) : (
            <>
              <span className="text-3xl font-bold" style={{ color }}>{remaining}g</span>
              <span className="text-xs text-gray-400">remaining</span>
            </>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="font-semibold text-sm" style={{ color: labelColor }}>{label}</p>
        <p className="text-sm text-gray-400 mt-0.5">{loggedG}g logged · {goalG}g goal</p>
      </div>
    </div>
  );
}
