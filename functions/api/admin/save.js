import { verifySession } from "../../_lib/session.js";
import { getFile, putFile } from "../../_lib/github.js";

const FILES = {
  news: "data/news.json",
  notices: "data/notices.json",
};
const LABELS = {
  news: "교회소식",
  notices: "공지사항",
};

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
  const { collection, items } = body;
  const filePath = FILES[collection];
  if (!filePath || !Array.isArray(items)) {
    return new Response(JSON.stringify({ error: "잘못된 요청입니다." }), {
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

  try {
    const current = await getFile(repo, branch, filePath, token).catch(() => null);
    const content = JSON.stringify({ items }, null, 2) + "\n";
    await putFile(repo, branch, filePath, token, content, current?.sha, `관리자: ${LABELS[collection]} 수정`);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
