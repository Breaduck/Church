// Nav solid on scroll
const nav = document.getElementById('nav');
const setNav = () => nav.classList.toggle('solid', window.scrollY > 20);
window.addEventListener('scroll', setNav, { passive: true });
setNav();

// Mobile nav
const toggle = document.getElementById('nav-toggle');
const links  = document.getElementById('nav-links');
toggle.addEventListener('click', () => {
  toggle.classList.toggle('open');
  links.classList.toggle('open');
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  toggle.classList.remove('open');
  links.classList.remove('open');
}));

// Smooth scroll with nav offset
document.querySelectorAll('a[href^="#"]').forEach(a =>
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.offsetTop - 56, behavior: 'smooth' });
  })
);

// Hero reveals on load
window.addEventListener('load', () => {
  document.querySelectorAll('.reveal-hero').forEach(el =>
    el.classList.add('visible')
  );
});

// YouTube 최신 설교 자동 로드 (localStorage 캐시 + 다중 프록시 폴백)
(function loadYouTube() {
  const CHANNEL_ID = 'UCqLNxJF2KSSbqPnnVwB2deQ';
  const RSS = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

  // 여러 CORS 프록시 시도 (하나 죽어도 다른 걸로 폴백)
  const PROXIES = [
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
    url => `https://cors.eu.org/${url}`,
  ];

  const CACHE_KEY = 'yt_cache_v2';
  const CACHE_TTL = 3600000; // 1시간

  const fmt = iso => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}`;
  };

  // XML namespace를 무시하고 태그를 찾는다 (yt:videoId 등)
  const getText = (parent, localName) => {
    // getElementsByTagNameNS('*', name) - 모든 namespace에서 매칭
    let el = parent.getElementsByTagNameNS('*', localName)[0];
    if (!el) el = parent.getElementsByTagName(localName)[0];
    if (!el) el = parent.getElementsByTagName(`yt:${localName}`)[0];
    return el ? el.textContent.trim() : '';
  };

  const parseXML = xml => {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return [];
    const entryEls = doc.getElementsByTagNameNS('*', 'entry').length
      ? doc.getElementsByTagNameNS('*', 'entry')
      : doc.getElementsByTagName('entry');
    return [...entryEls].slice(0, 4).map(e => ({
      videoId: getText(e, 'videoId'),
      title:   getText(e, 'title'),
      date:    getText(e, 'published'),
    })).filter(e => e.videoId);
  };

  const applyEntries = entries => {
    if (!entries.length) return;
    const [first, ...rest] = entries;

    const img = document.getElementById('yt-thumb-img');
    if (img && first.videoId) {
      img.src = `https://img.youtube.com/vi/${first.videoId}/mqdefault.jpg`;
      img.onerror = () => { img.src = `https://img.youtube.com/vi/${first.videoId}/hqdefault.jpg`; };
    }

    const ytLink = document.getElementById('yt-link');
    if (ytLink && first.videoId) ytLink.href = `https://www.youtube.com/watch?v=${first.videoId}`;

    const ytTitle = document.getElementById('yt-title');
    if (ytTitle && first.title) ytTitle.textContent = first.title;

    const ytDate = document.getElementById('yt-date');
    if (ytDate && first.date) ytDate.textContent = fmt(first.date);

    const rows = document.querySelectorAll('#yt-prev-list .prev-row');
    rest.slice(0, 3).forEach((e, i) => {
      if (!rows[i]) return;
      if (e.videoId) rows[i].href = `https://www.youtube.com/watch?v=${e.videoId}`;
      const d = e.date ? new Date(e.date) : null;
      const label = d && !isNaN(d.getTime())
        ? `${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}`
        : '—';
      const dateEl  = rows[i].querySelector('.prev-date');
      const titleEl = rows[i].querySelector('.prev-title');
      if (dateEl)  dateEl.textContent  = label;
      if (titleEl) titleEl.textContent = e.title || '—';
    });

    // 로딩 클래스 제거
    document.querySelectorAll('.sermon-block .yt-loading').forEach(el => el.classList.remove('yt-loading'));
  };

  // 로딩 상태 표시
  const setLoading = () => {
    const titleEl = document.getElementById('yt-title');
    if (titleEl && titleEl.textContent === '최신 설교') titleEl.textContent = '설교를 불러오는 중…';
  };

  // 캐시 먼저 적용 (즉시 표시)
  let hasCache = false;
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.ts < CACHE_TTL && Array.isArray(cached.entries) && cached.entries.length) {
      applyEntries(cached.entries);
      hasCache = true;
    }
  } catch (_) {}

  if (!hasCache) setLoading();

  // 프록시를 순차적으로 시도 - 성공하면 멈춤
  const tryProxies = async () => {
    for (const buildUrl of PROXIES) {
      try {
        const res = await fetch(buildUrl(RSS), { cache: 'no-store' });
        if (!res.ok) continue;
        const xml = await res.text();
        if (!xml || xml.length < 200) continue;
        const entries = parseXML(xml);
        if (!entries.length) continue;
        applyEntries(entries);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), entries })); } catch (_) {}
        return true;
      } catch (_) { /* try next */ }
    }
    return false;
  };

  tryProxies().then(ok => {
    if (!ok && !hasCache) {
      const titleEl = document.getElementById('yt-title');
      if (titleEl) titleEl.textContent = '유튜브 채널에서 최신 설교를 확인하세요';
    }
  });
})();

// Worship tabs
document.querySelectorAll('.wtab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wtab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.wpanel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById(`tab-${btn.dataset.tab}`);
    if (panel) panel.classList.add('active');
  });
});
