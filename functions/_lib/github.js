const API = "https://api.github.com";

function b64EncodeUtf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function b64DecodeUtf8(str) {
  return decodeURIComponent(escape(atob(str.replace(/\n/g, ""))));
}

async function ghFetch(path, token, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "jungdown-admin",
      ...(options.headers || {}),
    },
  });
}

export async function getFile(repo, branch, filePath, token) {
  const res = await ghFetch(`/repos/${repo}/contents/${filePath}?ref=${branch}`, token);
  if (!res.ok) throw new Error(`GET ${filePath} 실패: ${res.status}`);
  const data = await res.json();
  return { content: b64DecodeUtf8(data.content), sha: data.sha };
}

export async function putFile(repo, branch, filePath, token, content, sha, message) {
  const body = {
    message,
    content: b64EncodeUtf8(content),
    branch,
    ...(sha ? { sha } : {}),
  };
  const res = await ghFetch(`/repos/${repo}/contents/${filePath}`, token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PUT ${filePath} 실패: ${res.status} ${err}`);
  }
  return res.json();
}

// 여러 파일(이미지 여러 장 + JSON 등)을 하나의 커밋으로 한 번에 반영한다.
// 파일별로 따로 커밋하면 배포도 파일 수만큼 여러 번 걸리고, 중간에 하나라도 실패하면
// 앞서 올라간 파일만 고아로 남고 정작 데이터(JSON)는 저장되지 않는 문제가 있었다.
// files: [{ path, content, encoding: "base64" | "utf-8" }]
export async function commitFilesAtomic(repo, branch, token, files, message) {
  const refRes = await ghFetch(`/repos/${repo}/git/ref/heads/${branch}`, token);
  if (!refRes.ok) throw new Error(`브랜치 정보 조회 실패: ${refRes.status}`);
  const baseCommitSha = (await refRes.json()).object.sha;

  const commitRes = await ghFetch(`/repos/${repo}/git/commits/${baseCommitSha}`, token);
  if (!commitRes.ok) throw new Error(`커밋 정보 조회 실패: ${commitRes.status}`);
  const baseTreeSha = (await commitRes.json()).tree.sha;

  const treeEntries = [];
  for (const f of files) {
    const blobRes = await ghFetch(`/repos/${repo}/git/blobs`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: f.content, encoding: f.encoding }),
    });
    if (!blobRes.ok) throw new Error(`파일 업로드 실패(${f.path}): ${blobRes.status}`);
    const { sha } = await blobRes.json();
    treeEntries.push({ path: f.path, mode: "100644", type: "blob", sha });
  }

  const treeRes = await ghFetch(`/repos/${repo}/git/trees`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  });
  if (!treeRes.ok) throw new Error(`트리 생성 실패: ${treeRes.status}`);
  const newTreeSha = (await treeRes.json()).sha;

  const newCommitRes = await ghFetch(`/repos/${repo}/git/commits`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, tree: newTreeSha, parents: [baseCommitSha] }),
  });
  if (!newCommitRes.ok) throw new Error(`커밋 생성 실패: ${newCommitRes.status}`);
  const newCommitSha = (await newCommitRes.json()).sha;

  const updateRefRes = await ghFetch(`/repos/${repo}/git/refs/heads/${branch}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommitSha }),
  });
  if (!updateRefRes.ok) throw new Error(`브랜치 업데이트 실패: ${updateRefRes.status}`);
  return newCommitSha;
}
