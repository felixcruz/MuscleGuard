"use client";

interface Props {
  goalG: number;
  loggedG: number;
}

export function ProteinRing({ goalG, loggedG }: Props) {
  const pct = goalG > 0 ? Math.min(1, loggedG / goalG) : 0;
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference * (1 - pct);
  const remaining = Math.max(0, goalG - loggedG);

  const color =
    pct >= 1 ? "#16a34a" : pct >= 0.6 ? "#ca8a04" : "#dc2626";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg
          width={radius * 2}
          height={radius * 2}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Background track */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {pct >= 1 ? (
            <span className="text-3xl">✓</span>
          ) : (
            <>
              <span className="text-3xl font-bold" style={{ color }}>
                {remaining}g
              </span>
              <span className="text-xs text-gray-400">remaining</span>
            </>
          )}
        </div>
      </div>

      <div className="text-center">
        {pct >= 1 ? (
          <p className="text-brand-700 font-semibold">Protein goal reached!</p>
        ) : (
          <p className="text-gray-700 font-medium">
            You need <span className="text-brand-700 font-bold">{remaining}g more protein</span> today
          </p>
        )}
        <p className="text-sm text-gray-400 mt-0.5">
          {loggedG}g logged · {goalG}g goal
        </p>
      </div>
    </div>
  );
}
