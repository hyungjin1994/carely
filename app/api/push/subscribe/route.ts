import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const endpoint = body.endpoint;
  const p256dh = body.keys?.p256dh;
  const auth = body.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: user.id, endpoint, p256dh, auth },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { endpoint } = (await request.json().catch(() => ({}))) as { endpoint?: string };
  if (endpoint) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
  return NextResponse.json({ ok: true });
}
