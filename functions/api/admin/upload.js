import { verifySession } from "../../_lib/session.js";

export async function onRequestPost(context) {
  const secret = context.env.SESSION_SECRET;
  const authed = secret ? await verifySession(context.request, secret) : false;
  if (!authed) {
    return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    body = {};
  }
  const { filename, dataBase64 } = body;
  if (!filename || !dataBase64) {
    return new Response(JSON.stringify({ error: "파일 정보가 없습니다." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = context.env.GITHUB_TOKEN;
  const repo = context.env.GITHUB_REPO || "Breaduck/Church";
  const branch = context.env.GITHUB_BRANCH || "master";
  if (!token) {
    return new Response(JSON.stringify({ error: "GITHUB_TOKEN 환경변수가 설정되지 않았습니다." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const safeName = filename.replace(/[^\w.\-가-힣]/g, "_");
  const path = `img/news/${Date.now()}_${safeName}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "jungdown-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `관리자: 이미지 업로드 ${path}`,
        content: dataBase64,
        branch,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`업로드 실패: ${res.status} ${err}`);
    }
    return new Response(JSON.stringify({ ok: true, path: `/${path}` }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
