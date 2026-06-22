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
import { ResponsiveModal } from "@/components/modules/ui/common/responsive-modal";

interface VideoEditModalProps {
  videoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VideoEditModal = ({ videoId, open, onOpenChange }: VideoEditModalProps) => (
  <ResponsiveModal title="Edit Video" open={open} onOpenChange={onOpenChange}>
    {videoId ? (
      <Suspense fallback={<VideoEditFormSkeleton />}>
        <ErrorBoundary fallback={<p className="text-sm text-center py-4">Failed to load</p>}>
          <VideoEditForm videoId={videoId} onSuccess={() => onOpenChange(false)} />
        </ErrorBoundary>
      </Suspense>
    ) : null}
  </ResponsiveModal>
);

const VideoEditFormSkeleton = () => (
  <div className="flex flex-col gap-4 p-4">
    <Skeleton className="h-5 w-16" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-5 w-20" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

interface VideoEditFormProps {
  videoId: string;
  onSuccess: () => void;
}

const VideoEditForm = ({ videoId, onSuccess }: VideoEditFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: video } = useSuspenseQuery(trpc.videos.getOne.queryOptions({ id: videoId }));

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
        onSuccess();
      },
      onError: () => toast.error("Something went wrong"),
    }),
  );

  return (
    <div className="flex flex-col gap-4 p-4">
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

      <Button
        type="button"
        onClick={() => update.mutate({ id: videoId, title, visibility })}
        disabled={update.isPending || !title.trim()}
      >
        {update.isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
};
