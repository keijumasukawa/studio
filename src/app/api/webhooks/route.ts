import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { data } = evt;

      await db.insert(usersTable).values({
        clerkId: data.id,
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        imageUrl: data.image_url || "",
      });
    }

    if (eventType === "user.deleted") {
      const { data } = evt;

      if (!data.id) {
        return new Response("Missing user id", { status: 400 });
      }

      await db.delete(usersTable).where(eq(usersTable.clerkId, data.id));
    }

    if (eventType === "user.updated") {
      const { data } = evt;

      await db
        .update(usersTable)
        .set({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          imageUrl: data.image_url || "",
        })
        .where(eq(usersTable.clerkId, data.id));
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
