"use client";

import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Globe2Icon, LockIcon } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoPlayer } from "./video-player";

interface SectionProps {
  videoId: string;
}

export const SectionSkeleton = () => {
  return (
    <div className="max-w-screen-lg mx-auto px-4 pt-6 flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Skeleton className="w-full aspect-video rounded-xl" />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
};

const SectionSuspense = ({ videoId }: SectionProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: video } = useSuspenseQuery(
    trpc.videos.getOne.queryOptions({ id: videoId }),
  );

  const [title, setTitle] = useState(video.title);
  const [visibility, setVisibility] = useState(video.visibility);

  const update = useMutation(
    trpc.videos.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Video updated");
        const { queryKey } = trpc.videos.getMine.infiniteQueryOptions(
          { limit: DEFAULT_LIMIT },
          { getNextPageParam: (lastPage) => lastPage.nextCursor },
        );
        await queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries(trpc.videos.getOne.queryFilter());
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    }),
  );

  return (
    <div className="max-w-screen-lg mx-auto px-4 pt-6 flex flex-col gap-6">
      <form onSubmit={(e) => { e.preventDefault(); update.mutate({ id: videoId, title, visibility }); }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="rounded-xl overflow-hidden bg-muted aspect-video">
              {video.muxPlaybackId ? (
                <VideoPlayer
                  playbackId={video.muxPlaybackId}
                  thumbnailUrl={video.thumbnailUrl}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Video is being processed...</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as "public" | "private")}
              >
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe2Icon className="size-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <LockIcon className="size-4" />
                      Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </form>
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
