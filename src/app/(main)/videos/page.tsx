export const dynamic = 'force-dynamic';

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { DEFAULT_LIMIT } from "@/constants";

import { Section } from "@/components/modules/ui/videos/video-grid";

export default async function Home() {
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    trpc.videos.getMany.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Section />
    </HydrationBoundary>
  );
}
