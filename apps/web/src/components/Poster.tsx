import { type ReactNode } from 'react';
import { Image } from './Image.tsx';

interface PosterProps {
  src: string | null;
  /** Fallback text when there's no image. */
  fallback: string;
  /** Poster overlays (badges, progress pill) — fade in together with the image. */
  children?: ReactNode;
}

/**
 * A poster is just the shared {@link Image} sized to fill its parent box, with
 * a text fallback. All the fade/cache behaviour lives in Image so posters,
 * avatars and thumbnails stay identical.
 */
export function Poster({ src, fallback, children }: PosterProps) {
  return (
    <Image
      src={src}
      className="h-full w-full"
      fallback={<span className="px-2 text-xs text-muted-foreground">{fallback}</span>}
    >
      {children}
    </Image>
  );
}
