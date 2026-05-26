// Deterministic colored avatar from agent name. Skips an HTTP roundtrip to
// content.walbi.com and renders pixel-crisp without any image fetch.

const PALETTE = [
  "#aa3bff", "#22c55e", "#f97316", "#06b6d4",
  "#ef4444", "#facc15", "#3b82f6", "#ec4899",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function AgentAvatar({
  name,
  size = 36,
  badge,
}: {
  name: string;
  size?: number;
  badge?: "trending" | "verified" | "hiring";
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const color = PALETTE[hash(name) % PALETTE.length];

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.4,
      }}
      aria-label={name}
    >
      {initials}
      {badge ? (
        <span
          className={[
            "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background",
            badge === "verified"
              ? "bg-success"
              : badge === "trending"
                ? "bg-warning"
                : "bg-accent",
          ].join(" ")}
          aria-hidden
        />
      ) : null}
    </span>
  );
}
