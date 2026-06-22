import { videosRouter } from "@/trpc/routers/procedures";
import { createTRPCRouter } from "../init";
export const appRouter = createTRPCRouter({
  videos: videosRouter,
});

export type AppRouter = typeof appRouter;
