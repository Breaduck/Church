// GitHub OAuth 콜백 — code를 access token으로 교환하고, Decap CMS 팝업에 postMessage로 전달
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookie = context.request.headers.get("Cookie") || "";
  const stateCookie = /(?:^|;\s*)oauth_state=([^;]+)/.exec(cookie)?.[1];

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return new Response("잘못된 요청입니다 (state 불일치).", { status: 400 });
  }

  const clientId = context.env.GITHUB_CLIENT_ID;
  const clientSecret = context.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response("GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET 환경변수가 필요합니다.", { status: 500 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "decap-cms-cf-pages"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });

  const data = await tokenRes.json();
  if (!data.access_token) {
    return new Response("인증 실패: " + JSON.stringify(data), { status: 500 });
  }

  const payload = JSON.stringify({ token: data.access_token, provider: "github" });
  const successMsg = `authorization:github:success:${payload}`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8" /><title>로그인 완료</title></head>
<body>
<p style="font-family:sans-serif;text-align:center;margin-top:40px;">로그인 완료. 이 창은 자동으로 닫힙니다.</p>
<script>
(function() {
  function receive(e) {
    window.opener.postMessage(${JSON.stringify(successMsg)}, e.origin);
    window.removeEventListener("message", receive, false);
  }
  window.addEventListener("message", receive, false);
  window.opener && window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": "oauth_state=; Path=/; Max-Age=0; Secure; SameSite=Lax"
    }
  });
}
