import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import type { MediaItemDto } from '../../api/types.ts';

interface CastConfirmDrawerProps {
  /** The item awaiting confirmation; undefined keeps the drawer closed. */
  item: MediaItemDto | undefined;
  playerName: string | undefined;
  onConfirm: (item: MediaItemDto) => void;
  onClose: () => void;
}

/**
 * Guard rail against accidental mid-watch replacement: something is already
 * playing, so switching to a new title requires an explicit confirmation.
 */
export function CastConfirmDrawer({ item, playerName, onConfirm, onClose }: CastConfirmDrawerProps) {
  return (
    <Drawer open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {item && (
          <>
            <DrawerHeader className="flex-row items-center gap-4 text-left">
              {item.thumbUrl && (
                <img
                  src={item.thumbUrl}
                  alt=""
                  className="h-24 w-16 shrink-0 rounded-lg object-cover shadow-md"
                />
              )}
              <div className="min-w-0">
                <DrawerTitle className="line-clamp-2">{item.title}</DrawerTitle>
                <DrawerDescription>
                  {playerName ?? 'The player'} is already playing something. Replace it?
                </DrawerDescription>
              </div>
            </DrawerHeader>
            <DrawerFooter className="safe-bottom">
              <Button size="lg" onClick={() => onConfirm(item)}>
                <Play className="size-4" /> Play now
              </Button>
              <Button variant="secondary" size="lg" onClick={onClose}>
                Keep watching
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
