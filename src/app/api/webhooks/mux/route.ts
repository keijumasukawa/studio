import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { videosTable } from "@/db/schema";
import { mux } from "@/lib/mux";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();

  try {
    mux.webhooks.verifySignature(body, headersList, process.env.MUX_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid Mux webhook signature", { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.type === "video.upload.asset_created") {
    const uploadId = event.data.id as string;
    const assetId = event.data.asset_id as string;

    await db
      .update(videosTable)
      .set({ muxAssetId: assetId })
      .where(eq(videosTable.muxUploadId, uploadId));
  }

  if (event.type === "video.asset.ready") {
    const assetId = event.data.id as string;
    const playbackId = event.data.playback_ids?.[0]?.id as string | undefined;
    const duration = event.data.duration
      ? Math.round(event.data.duration * 1000)
      : 0;

    await db
      .update(videosTable)
      .set({
        muxStatus: event.data.status,
        muxPlaybackId: playbackId,
        duration,
        thumbnailUrl: playbackId
          ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
          : undefined,
        previewUrl: playbackId
          ? `https://image.mux.com/${playbackId}/animated.gif`
          : undefined,
      })
      .where(eq(videosTable.muxAssetId, assetId));
  }

  if (event.type === "video.asset.errored") {
    const assetId = event.data.id as string;

    await db
      .update(videosTable)
      .set({ muxStatus: event.data.status })
      .where(eq(videosTable.muxAssetId, assetId));
  }

  return new Response("Webhook received", { status: 200 });
}
