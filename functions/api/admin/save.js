import { verifySession } from "../../_lib/session.js";
import { getFile, putFile, commitFilesAtomic } from "../../_lib/github.js";

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
  const { collection, items, files } = body;
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

  const pendingFiles = Array.isArray(files) ? files : [];

  try {
    if (pendingFiles.length) {
      // 새로 첨부한 사진이 있으면: 사진 파일 + JSON을 한 커밋에 함께 반영한다.
      // (따로 커밋하면 배포가 여러 번 걸리고, 중간에 실패 시 사진만 고아로 남는 문제가 있었음)
      const pathMap = {};
      const imageEntries = pendingFiles.map((f, i) => {
        const safeName = String(f.filename || "image").replace(/[^\w.\-가-힣]/g, "_");
        const path = `img/news/${Date.now()}_${i}_${safeName}`;
        pathMap[f.id] = `/${path}`;
        return { path, content: f.dataBase64, encoding: "base64" };
      });

      // items 안의 "__pending:<id>" 자리표시자를 실제 업로드 경로로 치환
      let itemsText = JSON.stringify(items);
      itemsText = itemsText.replace(/__pending:([a-zA-Z0-9_-]+)/g, (m, id) => pathMap[id] || m);
      const finalItems = JSON.parse(itemsText);
      const content = JSON.stringify({ items: finalItems }, null, 2) + "\n";

      await commitFilesAtomic(
        repo,
        branch,
        token,
        [...imageEntries, { path: filePath, content, encoding: "utf-8" }],
        `관리자: ${LABELS[collection]} 저장 (사진 ${imageEntries.length}장 포함)`
      );
      return new Response(JSON.stringify({ ok: true, pathMap }), {
        headers: { "Content-Type": "application/json" },
      });
    }

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
