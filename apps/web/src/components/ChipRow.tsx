import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Chip {
  id: string;
  label: string;
}

interface ChipRowProps {
  chips: Chip[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
}

/** Horizontally scrollable single-select pill row (servers, libraries). */
export function ChipRow({ chips, activeId, onSelect }: ChipRowProps) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((chip) => (
        <Button
          key={chip.id}
          size="sm"
          variant={chip.id === activeId ? 'default' : 'secondary'}
          onClick={() => onSelect(chip.id)}
          className={cn('shrink-0 rounded-full', chip.id !== activeId && 'text-muted-foreground')}
        >
          {chip.label}
        </Button>
      ))}
    </div>
  );
}
