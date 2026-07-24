import { getRouteApi, useRouter } from '@tanstack/react-router';
import { ChevronLeft, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VirtualPosterGrid } from '../../components/VirtualPosterGrid.tsx';
import { PosterSkeleton } from '../../components/PosterSkeleton.tsx';
import { useCastFlow } from './useCastFlow.tsx';
import { useChildren } from '../../api/queries.ts';

const routeApi = getRouteApi('/browse/$serverId/$ratingKey');

/**
 * Children of a browsable item (show → seasons → episodes …). Each level is a
 * pushed route, so the browser/hardware back button walks back up naturally.
 */
export function DrillScreen() {
  const { serverId, ratingKey } = routeApi.useParams();
  const { t: title } = routeApi.useSearch();
  const router = useRouter();
  const { open, drawer } = useCastFlow();

  const children = useChildren(serverId, ratingKey);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.history.back()}
        className="self-start rounded-full"
      >
        <ChevronLeft className="size-4" />
        {title || 'Back'}
      </Button>

      {children.isLoading ? (
        <PosterSkeleton />
      ) : children.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">Couldn’t reach the server.</p>
          <Button variant="secondary" className="rounded-full" onClick={() => void children.refetch()}>
            <RotateCw className="size-4" /> Retry
          </Button>
        </div>
      ) : !children.data || children.data.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Nothing here
        </p>
      ) : (
        <VirtualPosterGrid items={children.data} onOpen={open} />
      )}

      {drawer}
    </div>
  );
}
