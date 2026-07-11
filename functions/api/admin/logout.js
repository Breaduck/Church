export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "admin_session=; Path=/; Max-Age=0; Secure; SameSite=Lax",
    },
  });
}
