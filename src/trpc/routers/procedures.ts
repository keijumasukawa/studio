import { z } from "zod";
import { and, desc, eq, getTableColumns, inArray, lt, or } from "drizzle-orm";

import { db } from "@/db";
import { mux } from "@/lib/mux";
import { TRPCError } from "@trpc/server";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { usersTable, videosTable, videoUpdateSchema } from "@/db/schema";

type VideoRow = typeof videosTable.$inferSelect;
type VideoSyncInput = Pick<
  VideoRow,
  "id" | "muxStatus" | "muxPlaybackId" | "muxAssetId" | "muxUploadId"
>;

async function syncWithMux(video: VideoSyncInput): Promise<Partial<VideoRow> | null> {
  if (video.muxStatus === "ready") return null;

  let assetId = video.muxAssetId;

  if (!assetId && video.muxUploadId) {
    const upload = await mux.video.uploads.retrieve(video.muxUploadId);
    assetId = upload.asset_id ?? null;
  }

  if (!assetId) return null;

  const asset = await mux.video.assets.retrieve(assetId);

  if (asset.status === video.muxStatus && assetId === video.muxAssetId) return null;

  const playbackId = asset.playback_ids?.[0]?.id;
  if (asset.status === "ready" && playbackId) {
    const [updated] = await db
      .update(videosTable)
      .set({
        muxStatus: "ready",
        muxAssetId: assetId,
        muxPlaybackId: playbackId,
        duration: asset.duration ? Math.round(asset.duration * 1000) : 0,
        thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
        previewUrl: `https://image.mux.com/${playbackId}/animated.gif`,
      })
      .where(eq(videosTable.id, video.id))
      .returning();
    return updated ?? null;
  }

  const [updated] = await db
    .update(videosTable)
    .set({ muxStatus: asset.status, muxAssetId: assetId })
    .where(eq(videosTable.id, video.id))
    .returning();
  return updated ?? null;
}

export const videosRouter = createTRPCRouter({
  getMine: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const data = await db
        .select({
          ...getTableColumns(videosTable),
          user: usersTable,
        })
        .from(videosTable)
        .innerJoin(usersTable, eq(videosTable.userId, usersTable.id))
        .where(
          and(
            eq(videosTable.userId, userId),
            cursor
              ? or(
                  lt(videosTable.updatedAt, cursor.updatedAt),
                  and(
                    eq(videosTable.updatedAt, cursor.updatedAt),
                    lt(videosTable.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(videosTable.updatedAt), desc(videosTable.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const raw = hasMore ? data.slice(0, -1) : data;
      const lastItem = raw[raw.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      const synced = await Promise.all(raw.map((v) => syncWithMux(v).catch(() => null)));
      const items = raw.map((v, i) => (synced[i] ? { ...v, ...synced[i] } : v));

      return { items, nextCursor };
    }),
  getMany: baseProcedure
    .input(
      z.object({
        userId: z.uuid().nullish(),
        cursor: z
          .object({
            id: z.uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input }) => {
      const { cursor, limit, userId } = input;

      const data = await db
        .select({
          ...getTableColumns(videosTable),
          user: usersTable,
        })
        .from(videosTable)
        .innerJoin(usersTable, eq(videosTable.userId, usersTable.id))
        .where(
          and(
            eq(videosTable.visibility, "public"),
            userId ? eq(videosTable.userId, userId) : undefined,
            cursor
              ? or(
                  lt(videosTable.updatedAt, cursor.updatedAt),
                  and(
                    eq(videosTable.updatedAt, cursor.updatedAt),
                    lt(videosTable.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(videosTable.updatedAt), desc(videosTable.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const raw = hasMore ? data.slice(0, -1) : data;
      const lastItem = raw[raw.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      const synced = await Promise.all(raw.map((v) => syncWithMux(v).catch(() => null)));
      const items = raw.map((v, i) => (synced[i] ? { ...v, ...synced[i] } : v));

      return { items, nextCursor };
    }),
  getOne: baseProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const [existingVideo] = await db
        .select({
          ...getTableColumns(videosTable),
          user: {
            ...getTableColumns(usersTable),
          },
        })
        .from(videosTable)
        .innerJoin(usersTable, eq(videosTable.userId, usersTable.id))
        .where(eq(videosTable.id, input.id));

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const synced = await syncWithMux(existingVideo);
      if (synced) {
        return { ...existingVideo, ...synced };
      }

      return existingVideo;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [removedVideo] = await db
        .delete(videosTable)
        .where(
          and(eq(videosTable.id, input.id), eq(videosTable.userId, userId)),
        )
        .returning();

      if (!removedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (removedVideo.muxAssetId) {
        await mux.video.assets.delete(removedVideo.muxAssetId).catch((e) => {
          console.error("Failed to delete Mux asset:", e);
        });
      }

      return removedVideo;
    }),
  removeMany: protectedProcedure
    .input(z.object({ ids: z.array(z.uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const removedVideos = await db
        .delete(videosTable)
        .where(
          and(
            inArray(videosTable.id, input.ids),
            eq(videosTable.userId, userId),
          ),
        )
        .returning();

      await Promise.all(
        removedVideos
          .filter((v) => v.muxAssetId)
          .map((v) =>
            mux.video.assets.delete(v.muxAssetId!).catch((e) => {
              console.error("Failed to delete Mux asset:", e);
            }),
          ),
      );
    }),
  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      if (!input.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [updatedVideo] = await db
        .update(videosTable)
        .set({
          title: input.title,
          visibility: input.visibility,
          updatedAt: new Date(),
        })
        .where(
          and(eq(videosTable.id, input.id), eq(videosTable.userId, userId)),
        )
        .returning();

      if (!updatedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updatedVideo;
    }),
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        playback_policy: ["public"],
      },
      cors_origin: "*",
    });

    const [video] = await db
      .insert(videosTable)
      .values({
        userId,
        title: "",
        muxStatus: "waiting",
        muxUploadId: upload.id,
      })
      .returning();

    return { url: upload.url, videoId: video.id };
  }),
});
