async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionCookie(username, secret, ttlMs = 1000 * 60 * 60 * 12) {
  const exp = Date.now() + ttlMs;
  const payload = `${username}.${exp}`;
  const sig = await hmacHex(secret, payload);
  const token = `${payload}.${sig}`;
  return `admin_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(ttlMs / 1000)}`;
}

export function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function verifySession(request, secret) {
  const token = getCookie(request, "admin_session");
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [username, exp, sig] = parts;
  if (Date.now() > Number(exp)) return false;
  const expected = await hmacHex(secret, `${username}.${exp}`);
  return sig === expected;
}
