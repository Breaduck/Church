// 유튜브 최신 설교 RSS를 서버에서 직접 가져와 JSON으로 반환
// (브라우저 CORS 제한 우회 — 외부 프록시 불필요)
// 쇼츠(Shorts)는 제외하고 일반 설교/예배 영상만 반환한다.
// 엣지 캐시 10분: 같은 결과를 반복 요청하지 않아 빠르게 응답

const CHANNEL_ID = 'UCqLNxJF2KSSbqPnnVwB2deQ';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const CACHE_SECONDS = 600;
const WANT = 4;        // 최종적으로 보여줄 영상 개수
const SCAN_MAX = 12;   // 쇼츠 판별을 위해 훑어볼 최대 영상 개수
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
  for (const block of blocks.slice(0, SCAN_MAX)) {
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

// 쇼츠 판별: youtube.com/shorts/{id} 요청이 200이면 쇼츠, 리다이렉트(3xx)면 일반 영상.
// 판별 실패 시에는 일반 영상으로 간주(포함)한다.
async function isShort(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: 'HEAD',
      redirect: 'manual',
      headers: { 'User-Agent': UA },
    });
    return res.status === 200;
  } catch (_) {
    return false;
  }
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/youtube', context.request.url).toString());

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let entries = [];
  try {
    // 유튜브 RSS는 실제 브라우저처럼 보이는 User-Agent가 없으면 404를 반환하므로
    // 정상적인 크롬 UA + Accept 헤더를 함께 보낸다.
    const res = await fetch(RSS_URL, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko,en;q=0.9',
      },
    });
    if (res.ok) {
      const parsed = parseEntries(await res.text());
      // 각 영상이 쇼츠인지 병렬로 판별한 뒤, 쇼츠를 제외하고 순서대로 WANT개만 남긴다.
      const flags = await Promise.all(parsed.map(e => isShort(e.videoId)));
      entries = parsed.filter((_, i) => !flags[i]).slice(0, WANT);
    }
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
