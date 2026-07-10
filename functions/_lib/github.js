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
