import { Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface VolumeSliderProps {
  volume: number;
  onChange: (level: number) => void;
}

export function VolumeSlider({ volume, onChange }: VolumeSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <Volume2 className="size-4 shrink-0 text-muted-foreground" />
      <Slider
        min={0}
        max={100}
        value={[volume]}
        onValueChange={([v]) => onChange(v ?? 0)}
      />
      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{volume}</span>
    </div>
  );
}
