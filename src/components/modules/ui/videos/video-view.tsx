"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoPlayer } from "./video-player";

interface SectionProps {
  videoId: string;
}

export const SectionSkeleton = () => {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] bg-black">
      <Skeleton className="w-full h-full" />
    </div>
  );
};

const SectionSuspense = ({ videoId }: SectionProps) => {
  const trpc = useTRPC();
  const { data: video } = useSuspenseQuery(
    trpc.videos.getOne.queryOptions({ id: videoId }),
  );

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] bg-black flex items-center justify-center">
      {video.muxPlaybackId ? (
        <VideoPlayer
          playbackId={video.muxPlaybackId}
          thumbnailUrl={video.thumbnailUrl}
        />
      ) : (
        <p className="text-white/60 text-sm">Video is being processed...</p>
      )}
    </div>
  );
};

export const Section = ({ videoId }: SectionProps) => {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <ErrorBoundary fallback={<p>Failed to load video</p>}>
        <SectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};
