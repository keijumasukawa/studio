"use client";

import MuxPlayer from "@mux/mux-player-react";

interface VideoPlayerProps {
  playbackId: string;
  thumbnailUrl?: string | null;
}

export const VideoPlayer = ({ playbackId, thumbnailUrl }: VideoPlayerProps) => {
  return (
    <MuxPlayer
      playbackId={playbackId}
      className="w-full h-full"
      accentColor="#f97316"
      poster={thumbnailUrl ?? undefined}
      autoPlay
      muted
    />
  );
};
