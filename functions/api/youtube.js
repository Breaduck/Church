// 유튜브 최신 설교 RSS를 서버에서 직접 가져와 JSON으로 반환
// (브라우저 CORS 제한 우회 — 외부 프록시 불필요)
// 엣지 캐시 10분: 같은 결과를 반복 요청하지 않아 빠르게 응답

const CHANNEL_ID = 'UCqLNxJF2KSSbqPnnVwB2deQ';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const CACHE_SECONDS = 600;

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parseEntries(xml) {
  const out = [];
  const blocks = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  for (const block of blocks.slice(0, 4)) {
    const pick = tag => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].trim() : '';
    };
    const videoId = pick('yt:videoId');
    if (!videoId) continue;
    out.push({
      videoId,
      title: decodeEntities(pick('title')),
      date: pick('published'),
    });
  }
  return out;
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/youtube', context.request.url).toString());

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let entries = [];
  try {
    const res = await fetch(RSS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (church-site rss fetcher)' },
    });
    if (res.ok) entries = parseEntries(await res.text());
  } catch (_) { /* 아래에서 빈 배열 응답 */ }

  const body = JSON.stringify({ entries });
  const response = new Response(body, {
    status: entries.length ? 200 : 502,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
      'Access-Control-Allow-Origin': '*',
    },
  });

  if (entries.length) {
    context.waitUntil(cache.put(cacheKey, response.clone()));
  }
  return response;
}
