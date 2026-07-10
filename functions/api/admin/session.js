import { verifySession } from "../../_lib/session.js";

export async function onRequestGet(context) {
  const secret = context.env.SESSION_SECRET;
  const ok = secret ? await verifySession(context.request, secret) : false;
  return new Response(JSON.stringify({ authenticated: ok }), {
    headers: { "Content-Type": "application/json" },
  });
}
