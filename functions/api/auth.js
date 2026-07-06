// GitHub OAuth 시작 — Decap CMS가 /api/auth 로 리다이렉트하면 GitHub 로그인 페이지로 넘김
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const clientId = context.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response("GITHUB_CLIENT_ID 환경변수가 설정되지 않았습니다.", { status: 500 });
  }

  const state = crypto.randomUUID();
  const scope = url.searchParams.get("scope") || "repo,user";
  const redirectUri = `${url.origin}/api/callback`;

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri);

  return new Response(null, {
    status: 302,
    headers: {
      "Location": authUrl.toString(),
      "Set-Cookie": `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`
    }
  });
}
