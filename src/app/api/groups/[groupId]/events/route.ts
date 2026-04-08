import { NextRequest } from "next/server";

import { parseSseToken, requireGroupMembership } from "@/lib/group";
import { subscribeToGroup } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;

  try {
    const token = request.nextUrl.searchParams.get("token");
    const payload = parseSseToken(token);

    await requireGroupMembership(groupId, payload.userId);

    let dispose = () => {};

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        dispose = subscribeToGroup(groupId, controller);
        controller.enqueue(encoder.encode("event: ready\ndata: connected\n\n"));

        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(": ping\n\n"));
        }, 15000);

        request.signal.addEventListener("abort", () => {
          clearInterval(keepAlive);
          dispose();
          controller.close();
        });
      },
      cancel() {
        dispose();
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
