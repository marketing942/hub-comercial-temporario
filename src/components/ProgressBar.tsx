export default function ProgressBar({
  value,
  color = "#7c5cff",
  height = 10,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full rounded-full bg-border/60 overflow-hidden" style={{ height }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${v}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: "width 500ms ease",
        }}
      />
    </div>
  );
}
