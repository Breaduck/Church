// 유튜브 최신 설교 목록을 서버에서 직접 가져와 JSON으로 반환
// (브라우저 CORS 제한 우회 — 외부 프록시 불필요)
//
// 1순위: 채널의 '동영상' 탭(/videos) 페이지를 파싱한다.
//   - 이 탭에는 쇼츠·라이브 스트림이 들어가지 않으므로 설교 영상만 나온다.
//   - 채널 ID 기반 URL이라 핸들(@이름)을 바꿔도 영향이 없다.
//   - 업로드 날짜는 각 영상 페이지의 datePublished에서 읽는다.
// 2순위: 유튜브 RSS (2026년 현재 유튜브 측 장애로 404가 잦아 폴백으로만 사용)
// 엣지 캐시 10분: 같은 결과를 반복 요청하지 않아 빠르게 응답

const CHANNEL_ID = 'UCqLNxJF2KSSbqPnnVwB2deQ';
const VIDEOS_URL = `https://www.youtube.com/channel/${CHANNEL_ID}/videos`;
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const CACHE_SECONDS = 600;
const WANT = 4;        // 최종적으로 보여줄 영상 개수
const SCAN_MAX = 12;   // RSS 폴백에서 쇼츠 판별을 위해 훑어볼 최대 영상 개수
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  'Accept-Language': 'ko-KR,ko;q=0.9',
  // 유럽 리전 엣지에서 동의(consent) 페이지로 빠지지 않도록
  'Cookie': 'CONSENT=YES+1; SOCS=CAI',
};

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// ---------- 1순위: /videos 페이지 파싱 ----------

function extractInitialData(html) {
  const m = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
  return m ? JSON.parse(m[1]) : null;
}

// ytInitialData 안의 영상 카드(신형 lockupViewModel / 구형 videoRenderer)를 순서대로 모은다.
function collectVideos(data) {
  const out = [];
  const seen = new Set();
  (function walk(o) {
    if (!o || typeof o !== 'object' || out.length >= WANT) return;
    if (o.lockupViewModel) {
      const l = o.lockupViewModel;
      const videoId = l.contentId;
      const title = l.metadata?.lockupMetadataViewModel?.title?.content || '';
      if (videoId && !seen.has(videoId)) { seen.add(videoId); out.push({ videoId, title, date: '' }); }
      return;
    }
    if (o.videoRenderer) {
      const v = o.videoRenderer;
      const title = v.title?.runs?.[0]?.text || v.title?.simpleText || '';
      if (v.videoId && !seen.has(v.videoId)) { seen.add(v.videoId); out.push({ videoId: v.videoId, title, date: '' }); }
      return;
    }
    for (const k in o) walk(o[k]);
  })(data);
  return out;
}

async function fetchPublishDate(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: HEADERS });
    if (!res.ok) return '';
    const html = await res.text();
    const m = html.match(/itemprop="datePublished" content="([^"]+)"/)
      || html.match(/"publishDate":"([^"]+)"/)
      || html.match(/itemprop="uploadDate" content="([^"]+)"/);
    return m ? m[1] : '';
  } catch (_) {
    return '';
  }
}

async function fromVideosPage() {
  const res = await fetch(VIDEOS_URL, { headers: HEADERS });
  if (!res.ok) return [];
  const data = extractInitialData(await res.text());
  if (!data) return [];
  const entries = collectVideos(data);
  const dates = await Promise.all(entries.map(e => fetchPublishDate(e.videoId)));
  entries.forEach((e, i) => { e.date = dates[i]; });
  return entries;
}

// ---------- 2순위: RSS 폴백 ----------

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

async function fromRss() {
  const res = await fetch(RSS_URL, {
    headers: {
      ...HEADERS,
      'Accept': 'application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!res.ok) return [];
  const parsed = parseEntries(await res.text());
  const flags = await Promise.all(parsed.map(e => isShort(e.videoId)));
  return parsed.filter((_, i) => !flags[i]).slice(0, WANT);
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/youtube', context.request.url).toString());

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let entries = [];
  try { entries = await fromVideosPage(); } catch (_) {}
  if (!entries.length) {
    try { entries = await fromRss(); } catch (_) {}
  }

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
