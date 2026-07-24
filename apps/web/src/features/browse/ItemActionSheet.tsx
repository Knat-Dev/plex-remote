import type { ComponentType } from 'react';
import {
  Check,
  CircleCheck,
  FolderOpen,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { formatRemaining } from '../../util/format.ts';
import type { MediaItemDto } from '../../api/types.ts';

export interface ItemAction {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  run: () => void;
  destructive?: boolean;
}

interface ItemActionSheetProps {
  item: MediaItemDto | undefined;
  /** Something else is playing — casting will replace it. */
  replacePrompt: boolean;
  onWatch: (item: MediaItemDto, offsetMs: number) => void;
  onOpen: (item: MediaItemDto) => void;
  onMarkWatched: (item: MediaItemDto, watched: boolean) => void;
  onClose: () => void;
}

/**
 * Long-press action sheet, generic to any item and context-aware: it lists
 * only the actions this app supports for that item's watch state — Watch /
 * Resume / Restart for playables, Open for containers, and Mark
 * watched/unwatched throughout. Mirrors Plex's quick-actions sheet.
 */
export function ItemActionSheet({
  item,
  replacePrompt,
  onWatch,
  onOpen,
  onMarkWatched,
  onClose,
}: ItemActionSheetProps) {
  const actions = item ? buildActions(item, { replacePrompt, onWatch, onOpen, onMarkWatched }) : [];

  return (
    <Drawer open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {item && (
          <>
            <DrawerHeader className="text-center">
              <DrawerTitle className="line-clamp-2">
                {item.showTitle ? `${item.showTitle} · ${item.subtitle ?? ''}` : item.title}
              </DrawerTitle>
            </DrawerHeader>
            <Separator />
            <nav className="safe-bottom flex flex-col py-1">
              {actions.map((action) => (
                <button
                  key={action.key}
                  onClick={action.run}
                  className="flex items-center gap-4 px-5 py-3.5 text-left transition active:bg-accent"
                >
                  <action.icon
                    className={action.destructive ? 'size-5 text-destructive' : 'size-5'}
                  />
                  <span className={action.destructive ? 'text-destructive' : ''}>
                    {action.label}
                  </span>
                </button>
              ))}
            </nav>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function buildActions(
  item: MediaItemDto,
  handlers: {
    replacePrompt: boolean;
    onWatch: (item: MediaItemDto, offsetMs: number) => void;
    onOpen: (item: MediaItemDto) => void;
    onMarkWatched: (item: MediaItemDto, watched: boolean) => void;
  },
): ItemAction[] {
  const { onWatch, onOpen, onMarkWatched } = handlers;
  const out: ItemAction[] = [];
  const inProgress = (item.progressMs ?? 0) > 0;

  if (item.browsable) {
    out.push({ key: 'open', label: 'Open', icon: FolderOpen, run: () => onOpen(item) });
  } else if (inProgress) {
    const left =
      item.durationMs != null ? ` · ${formatRemaining(item.durationMs - (item.progressMs ?? 0))}` : '';
    out.push({
      key: 'resume',
      label: `Resume${left}`,
      icon: Play,
      run: () => onWatch(item, item.progressMs ?? 0),
    });
    out.push({ key: 'restart', label: 'Restart', icon: RotateCcw, run: () => onWatch(item, 0) });
  } else {
    out.push({ key: 'watch', label: 'Watch', icon: Play, run: () => onWatch(item, 0) });
  }

  // Mark watched unless already fully watched.
  if (!item.watched) {
    out.push({
      key: 'watched',
      label: 'Mark as Watched',
      icon: CircleCheck,
      run: () => onMarkWatched(item, true),
    });
  }
  // Mark unwatched when watched or partially watched.
  if (item.watched || inProgress || item.unwatchedCount != null) {
    out.push({
      key: 'unwatched',
      label: 'Mark as Unwatched',
      icon: Check,
      run: () => onMarkWatched(item, false),
    });
  }

  return out;
}
