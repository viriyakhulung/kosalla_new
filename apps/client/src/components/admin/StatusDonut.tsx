import type { StatusSlice } from "@/lib/dashboard";

export function StatusDonut({ slices, total }: { slices: StatusSlice[]; total: number }) {
  const size = 168;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const segments = slices
    .filter((s) => s.count > 0)
    .map((s) => {
      const frac = total > 0 ? s.count / total : 0;
      const len = frac * c;
      const seg = { ...s, len, dashOffset: -offset };
      offset += len;
      return seg;
    });

  return (
    <div className="flex items-center justify-center" aria-label="Distribusi status tiket">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef0f3" strokeWidth={stroke} />
        {total > 0 &&
          segments.map((seg) => (
            <circle
              key={seg.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${seg.len} ${c - seg.len}`}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
            />
          ))}
      </svg>
      {/* center label */}
      <div className="pointer-events-none -ml-[168px] flex h-[168px] w-[168px] flex-col items-center justify-center">
        <span className="text-3xl font-extrabold leading-none text-slate-900">{total}</span>
        <span className="mt-1 text-[11px] font-medium text-slate-500">Total Tiket</span>
      </div>
    </div>
  );
}
