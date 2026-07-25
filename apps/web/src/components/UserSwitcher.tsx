import { useState } from 'react';
import { Check, User } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Image } from './Image.tsx';
import { useSetActiveUser, useUsers } from '../api/queries.ts';

/**
 * Plex Home user switcher: an avatar in the header that opens a picker.
 * Switching changes whose watch state (Continue Watching, progress) the app
 * reads — so a household member sees their own row, not the owner's.
 */
export function UserSwitcher() {
  const { data } = useUsers();
  const setActive = useSetActiveUser();
  const [open, setOpen] = useState(false);

  const active = data?.users.find((u) => u.uuid === data.activeUuid);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Switch user"
        className="size-8 overflow-hidden rounded-full bg-secondary ring-1 ring-border"
      >
        <Image
          src={active?.thumb ?? null}
          className="h-full w-full"
          fallback={<User className="size-4 text-muted-foreground" />}
        />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>Watching as</DrawerTitle>
          </DrawerHeader>
          <Separator />
          <nav className="safe-bottom flex flex-col py-1">
            {(data?.users ?? []).map((user) => {
              const isActive = user.uuid === data?.activeUuid;
              return (
                <button
                  key={user.uuid}
                  onClick={() => {
                    setActive.mutate(user.uuid);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-5 py-3 text-left transition active:bg-accent"
                >
                  <span className="size-9 overflow-hidden rounded-full bg-secondary ring-1 ring-border">
                    <Image
                      src={user.thumb ?? null}
                      className="h-full w-full"
                      fallback={<User className="size-4 text-muted-foreground" />}
                    />
                  </span>
                  <span className={cn('flex-1', isActive && 'font-semibold')}>{user.title}</span>
                  {isActive && <Check className="size-5 text-primary" />}
                </button>
              );
            })}
          </nav>
        </DrawerContent>
      </Drawer>
    </>
  );
}
