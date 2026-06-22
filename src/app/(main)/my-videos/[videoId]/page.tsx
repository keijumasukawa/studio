import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";
import { Section } from "@/components/modules/ui/videos/video-edit-view";

interface PageProps {
  params: Promise<{ videoId: string }>;
}

export default async function MyVideoEditPage({ params }: PageProps) {
  const { videoId } = await params;
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(trpc.videos.getOne.queryOptions({ id: videoId }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Section videoId={videoId} />
    </HydrationBoundary>
  );
}
