import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw } from 'lucide-react';
import { formatTime } from '../../util/format.ts';
import type { MediaItemDto } from '../../api/types.ts';

export type CastDecision =
  /** Something else is playing — replace it? */
  | { step: 'replace'; item: MediaItemDto }
  /** Item is partially watched — resume or start over? */
  | { step: 'resume'; item: MediaItemDto };

interface CastSheetProps {
  decision: CastDecision | undefined;
  playerName: string | undefined;
  /** Proceed with the cast at the given offset (undefined = keep deciding). */
  onCast: (item: MediaItemDto, offsetMs: number) => void;
  /** The replace step was accepted; move to the next decision. */
  onReplaceConfirmed: (item: MediaItemDto) => void;
  onClose: () => void;
}

/**
 * The pre-cast decision sheet, Plex-style: guards against replacing an active
 * session, then offers Resume from the saved position / Start over when the
 * item is partially watched.
 */
export function CastSheet({
  decision,
  playerName,
  onCast,
  onReplaceConfirmed,
  onClose,
}: CastSheetProps) {
  return (
    <Drawer open={Boolean(decision)} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {decision && (
          <>
            <DrawerHeader className="flex-row items-center gap-4 text-left">
              {decision.item.thumbUrl && (
                <img
                  src={decision.item.thumbUrl}
                  alt=""
                  className="h-24 w-16 shrink-0 rounded-lg object-cover shadow-md"
                />
              )}
              <div className="min-w-0">
                <DrawerTitle className="line-clamp-2">{decision.item.title}</DrawerTitle>
                <DrawerDescription>
                  {decision.step === 'replace'
                    ? `${playerName ?? 'The player'} is already playing something. Replace it?`
                    : `You stopped at ${formatTime(decision.item.progressMs ?? 0)}.`}
                </DrawerDescription>
              </div>
            </DrawerHeader>

            <DrawerFooter className="safe-bottom">
              {decision.step === 'replace' ? (
                <>
                  <Button size="lg" onClick={() => onReplaceConfirmed(decision.item)}>
                    <Play className="size-4" /> Play now
                  </Button>
                  <Button variant="secondary" size="lg" onClick={onClose}>
                    Keep watching
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => onCast(decision.item, decision.item.progressMs ?? 0)}
                  >
                    <Play className="size-4" /> Resume from{' '}
                    {formatTime(decision.item.progressMs ?? 0)}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => onCast(decision.item, 0)}
                  >
                    <RotateCcw className="size-4" /> Start over
                  </Button>
                </>
              )}
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
