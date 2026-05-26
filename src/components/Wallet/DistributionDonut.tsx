import type {SubAccount} from "../../lib/mock/types";

interface Props {
  accounts: SubAccount[];
  size?: number;
  thickness?: number;
}

// Inline SVG donut — no recharts dependency for such a small chart, and
// the layout adapts beautifully (svg scales). Each segment is a stroke arc
// on the same circle.

export function DistributionDonut({accounts, size = 160, thickness = 18}: Props) {
  const total = accounts.reduce((s, a) => s + a.balance, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative grid place-items-center" style={{width: size, height: size}}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="oklch(0.25 0.005 264)"
          strokeWidth={thickness}
        />
        {accounts.map((a) => {
          const share = a.balance / total;
          const len = c * share;
          const segment = (
            <circle
              key={a.id}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return segment;
        })}
      </svg>
      <div className="absolute text-center">
        <div className="text-[10px] uppercase tracking-wide text-muted">Распределение</div>
      </div>
    </div>
  );
}
