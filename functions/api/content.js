// 공개 콘텐츠 실시간 조회: 관리자가 저장(=GitHub 커밋)하면 배포를 기다리지 않고
// GitHub에서 바로 최신 내용을 읽어와 즉시 반영한다.
// 예) /api/content?type=news , /api/content?type=notices

import { getFile } from "../_lib/github.js";

const FILES = {
  news: "data/news.json",
  notices: "data/notices.json",
};

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const type = url.searchParams.get("type");
  const filePath = FILES[type];
  if (!filePath) {
    return json({ error: "type must be news or notices" }, 400);
  }

  const token = context.env.GITHUB_TOKEN;
  const repo = context.env.GITHUB_REPO || "Breaduck/Church";
  const branch = context.env.GITHUB_BRANCH || "master";
  if (!token) {
    return json({ error: "no token" }, 502);
  }

  try {
    const { content } = await getFile(repo, branch, filePath, token);
    // 파싱 검증 후 그대로 전달 (실패 시 아래 catch에서 502 → 클라이언트가 정적 파일로 폴백)
    const data = JSON.parse(content);
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
