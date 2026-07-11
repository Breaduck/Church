import { createSessionCookie } from "../../_lib/session.js";

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    body = {};
  }
  const { username, password } = body;

  const envUser = context.env.ADMIN_USERNAME;
  const envPass = context.env.ADMIN_PASSWORD;
  const secret = context.env.SESSION_SECRET;

  if (!envUser || !envPass || !secret) {
    return new Response(
      JSON.stringify({ error: "서버에 ADMIN_USERNAME / ADMIN_PASSWORD / SESSION_SECRET 환경변수가 설정되지 않았습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (username !== envUser || password !== envPass) {
    return new Response(
      JSON.stringify({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const cookie = await createSessionCookie(username, secret);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
  });
}
