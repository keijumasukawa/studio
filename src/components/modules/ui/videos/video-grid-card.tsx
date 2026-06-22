import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

import { Skeleton } from "@/components/ui/skeleton";
import { VideoThumbnail, VideoThumbnailSkeleton } from "./video-thumbnail";

interface VideoGridCardProps {
  id: string;
  title: string;
  duration: number;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  createdAt: Date;
  user: {
    imageUrl: string;
    firstName: string;
    lastName: string;
  };
}

export const VideoGridCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 w-full bg-sidebar rounded-xl overflow-hidden">
      <div className="p-2">
        <VideoThumbnailSkeleton />
      </div>
      <div className="flex gap-3 p-2 pt-0">
        <Skeleton className="size-9 rounded-full shrink-0" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
};

export const VideoGridCard = ({
  id,
  title,
  duration,
  thumbnailUrl,
  previewUrl,
  createdAt,
  user,
}: VideoGridCardProps) => {
  return (
    <Link prefetch href={`/videos/${id}`}>
      <div className="flex flex-col gap-2 w-full group bg-sidebar rounded-xl overflow-hidden">
        <div className="p-2">
          <VideoThumbnail
            imageUrl={thumbnailUrl}
            previewUrl={previewUrl}
            title={title}
            duration={duration}
          />
        </div>
        <div className="flex gap-3 p-2 pt-0">
          <div className="shrink-0">
            <Image
              src={user.imageUrl}
              alt={`${user.firstName} ${user.lastName}`}
              width={36}
              height={36}
              className="size-9 rounded-full"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium line-clamp-2 leading-snug">
              {title}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
