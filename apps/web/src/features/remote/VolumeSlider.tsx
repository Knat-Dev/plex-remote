interface VolumeSliderProps {
  volume: number;
  onChange: (level: number) => void;
}

export function VolumeSlider({ volume, onChange }: VolumeSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--color-muted)]">VOL</span>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full appearance-none rounded-full accent-[var(--color-brand)]"
        style={{
          background: `linear-gradient(to right, var(--color-brand) ${volume}%, var(--color-border) ${volume}%)`,
        }}
      />
      <span className="w-8 text-right text-xs tabular-nums text-[var(--color-muted)]">{volume}</span>
    </div>
  );
}
