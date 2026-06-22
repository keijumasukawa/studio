"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/modules/ui/common/infinite-scroll";
import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from "./video-grid-card";

export const Section = () => {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <SectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

export const SectionSkeleton = () => {
  return (
    <div className="p-4 gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: DEFAULT_LIMIT }).map((_, i) => (
        <VideoGridCardSkeleton key={i} />
      ))}
    </div>
  );
};

const SectionSuspense = () => {
  const trpc = useTRPC();
  const { data: videos, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.videos.getMany.infiniteQueryOptions(
        { limit: DEFAULT_LIMIT },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
      ),
    );

  return (
    <div className="p-4">
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {videos.pages.flatMap((page) => page.items).map((video) => (
          <VideoGridCard
            key={video.id}
            id={video.id}
            title={video.title}
            duration={video.duration}
            thumbnailUrl={video.thumbnailUrl}
            previewUrl={video.previewUrl}
            createdAt={video.createdAt}
            user={video.user}
          />
        ))}
      </div>
      <InfiniteScroll
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </div>
  );
};
