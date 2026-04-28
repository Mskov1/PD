export default function WaterTube({ level = 50, color = "var(--ht-water)", size = "md" }) {
  const heights = { sm: 40, md: 64, lg: 80 };
  const widths = { sm: 16, md: 22, lg: 28 };
  const h = heights[size] || heights.md;
  const w = widths[size] || widths.md;
  const fillH = (level / 100) * (h - 8);
  const r = w / 2;

  return (
    <div
      data-testid="water-tube"
      className="relative flex-shrink-0"
      style={{ width: w, height: h }}
    >
      {/* Outer tube */}
      <div
        className="absolute inset-0 rounded-full border-2 overflow-hidden"
        style={{ borderColor: `${color}40` }}
      >
        {/* Fill */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b-full transition-all duration-700 ease-out"
          style={{
            height: `${fillH}px`,
            backgroundColor: color,
            opacity: 0.7,
          }}
        />
        {/* Highlight */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b-full"
          style={{
            height: `${fillH}px`,
            background: `linear-gradient(to right, transparent 20%, rgba(255,255,255,0.3) 50%, transparent 80%)`,
          }}
        />
      </div>
    </div>
  );
}
