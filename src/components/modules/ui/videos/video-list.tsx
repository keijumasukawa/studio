"use client";

import { useState, Suspense } from "react";
import { format } from "date-fns";
import { Globe2Icon, LockIcon, Trash2Icon } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { useMutation, useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { snakeCaseToTitle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VideoThumbnail } from "./video-thumbnail";
import { InfiniteScroll } from "@/components/modules/ui/common/infinite-scroll";
import { VideoUploadModal } from "./video-upload-modal";
import { VideoEditModal } from "./video-edit-modal";

export const Section = () => (
  <Suspense fallback={<SectionSkeleton />}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <SectionSuspense />
    </ErrorBoundary>
  </Suspense>
);

const SectionSkeleton = () => (
  <>
    <div className="sticky top-14 z-10 flex items-center justify-between px-6 py-2 border-b bg-background">
      <div />
      <Skeleton className="h-8 w-20" />
    </div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 pl-6" />
          <TableHead className="pl-2 w-127.5">Video</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell className="pl-6"><Skeleton className="size-4" /></TableCell>
            <TableCell className="pl-2">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-36" />
                <Skeleton className="h-4 w-40" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </>
);

const SectionSuspense = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: videos, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.videos.getMine.infiniteQueryOptions(
        { limit: DEFAULT_LIMIT },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor,
          refetchInterval: (query) => {
            const items = query.state.data?.pages.flatMap((p) => p.items) ?? [];
            return items.some((v) => v.muxStatus !== "ready") ? 5000 : false;
          },
        },
      ),
    );

  const removeMany = useMutation(
    trpc.videos.removeMany.mutationOptions({
      onSuccess: async () => {
        toast.success(`${selectedIds.size} video${selectedIds.size > 1 ? "s" : ""} deleted`);
        setSelectedIds(new Set());
        const { queryKey } = trpc.videos.getMine.infiniteQueryOptions(
          { limit: DEFAULT_LIMIT },
          { getNextPageParam: (lastPage) => lastPage.nextCursor },
        );
        await queryClient.invalidateQueries({ queryKey });
      },
      onError: () => toast.error("Something went wrong"),
    }),
  );

  const allItems = videos.pages.flatMap((page) => page.items);
  const allSelected = allItems.length > 0 && allItems.every((v) => selectedIds.has(v.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(allItems.map((v) => v.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <>
      <VideoEditModal
        videoId={selectedVideoId}
        open={!!selectedVideoId}
        onOpenChange={(open) => { if (!open) setSelectedVideoId(null); }}
      />

      <div className="sticky top-14 z-10 flex items-center justify-between px-6 py-2 border-b bg-background">
        <div className="flex items-center gap-3">
          {someSelected && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={removeMany.isPending}>
                    <Trash2Icon className="size-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {selectedIds.size} video{selectedIds.size > 1 ? "s" : ""}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The selected videos will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeMany.mutate({ ids: Array.from(selectedIds) })}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
        <VideoUploadModal />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 pl-6">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="pl-2 w-127.5">Video</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allItems.map((video) => (
            <TableRow
              key={video.id}
              className="cursor-pointer"
              onClick={() => setSelectedVideoId(video.id)}
            >
              <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(video.id)}
                  onCheckedChange={() => toggleOne(video.id)}
                  aria-label="Select video"
                />
              </TableCell>
              <TableCell className="pl-2">
                <div className="flex items-center gap-4">
                  <div className="relative aspect-video w-36 shrink-0">
                    <VideoThumbnail
                      imageUrl={video.thumbnailUrl}
                      previewUrl={video.previewUrl}
                      title={video.title}
                      duration={video.duration || 0}
                    />
                  </div>
                  <span className="text-sm line-clamp-1">{video.title}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  {video.visibility === "private"
                    ? <LockIcon className="size-4 mr-2" />
                    : <Globe2Icon className="size-4 mr-2" />}
                  {snakeCaseToTitle(video.visibility)}
                </div>
              </TableCell>
              <TableCell>
                {snakeCaseToTitle(video.muxStatus || "error")}
              </TableCell>
              <TableCell className="text-sm truncate">
                {format(new Date(video.createdAt), "d MMM yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <InfiniteScroll
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </>
  );
};
