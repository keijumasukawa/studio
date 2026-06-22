"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  Globe2Icon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveModal } from "@/components/modules/ui/common/responsive-modal";
import { VideoUploader } from "./video-uploader";

export const VideoUploadModal = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [uploadComplete, setUploadComplete] = useState(false);

  const create = useMutation(
    trpc.videos.create.mutationOptions({
      onError: () => toast.error("Something went wrong"),
    }),
  );

  const update = useMutation(
    trpc.videos.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Video created");
        const { queryKey } = trpc.videos.getMine.infiniteQueryOptions(
          { limit: DEFAULT_LIMIT },
          { getNextPageParam: (lastPage) => lastPage.nextCursor },
        );
        await queryClient.invalidateQueries({ queryKey });
        create.reset();
      },
      onError: () => toast.error("Something went wrong"),
    }),
  );

  const remove = useMutation(trpc.videos.remove.mutationOptions());

  // create.reset() clears create.data before onOpenChange fires in the success path,
  // so videoId is only present when the user cancels without completing.
  const handleOpenChange = (open: boolean) => {
    if (!open && create.data?.videoId) {
      remove.mutate({ id: create.data.videoId });
    }
    create.reset();
    setTitle("");
    setVisibility("private");
    setUploadComplete(false);
  };

  return (
    <>
      <ResponsiveModal
        title="Upload a video"
        open={!!create.data?.url}
        onOpenChange={handleOpenChange}
      >
        {create.data?.url ? (
          <div className="flex flex-col gap-4 p-4">
            {uploadComplete ? (
              <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle2Icon className="size-4" />
                Video uploaded
              </div>
            ) : (
              <VideoUploader
                endpoint={create.data.url}
                onSuccess={() => setUploadComplete(true)}
              />
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="upload-title">Title</Label>
              <Input
                id="upload-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="upload-visibility">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as "public" | "private")}
              >
                <SelectTrigger id="upload-visibility">
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
              onClick={() => {
                if (!create.data?.videoId) return;
                update.mutate({ id: create.data.videoId, title, visibility });
              }}
              disabled={!title.trim() || !uploadComplete || update.isPending}
            >
              {update.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <Loader2Icon className="animate-spin" />
          </div>
        )}
      </ResponsiveModal>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => create.mutate()}
        disabled={create.isPending}
      >
        {create.isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <PlusIcon />
        )}
        Create
      </Button>
    </>
  );
};
