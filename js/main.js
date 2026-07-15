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
document.querySelectorAll('a[href^="#"]').forEach(a => {
  if (a.hasAttribute('data-poster-trigger')) return;
  if (a.hasAttribute('data-notice-open')) return;
  a.addEventListener('click', e => {
    const hash = a.getAttribute('href');
    if (!hash) return;
    if (hash === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const t = document.querySelector(hash);
    if (!t) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 60;
    const y = t.getBoundingClientRect().top + window.scrollY - navH - 12;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
});

// Hero reveals on load
window.addEventListener('load', () => {
  document.querySelectorAll('.reveal-hero').forEach(el =>
    el.classList.add('visible')
  );
});

// Section reveals on scroll
const obs = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    }
  }),
  { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
);

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 6) * 90}ms`;
  obs.observe(el);
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
        : '';
      const dateEl  = rows[i].querySelector('.prev-date');
      const titleEl = rows[i].querySelector('.prev-title');
      if (dateEl)  dateEl.textContent  = label;
      if (titleEl) titleEl.textContent = e.title || '';
    });

    // 로딩 클래스 제거
    document.querySelectorAll('.sermon-block .yt-loading').forEach(el => el.classList.remove('yt-loading'));
  };

  // 로딩 상태 표시
  const setLoading = () => {
    const titleEl = document.getElementById('yt-title');
    if (titleEl && titleEl.textContent === '최신 설교') titleEl.textContent = '설교를 불러오는 중…';
  };

  // 캐시가 있으면 (오래됐더라도) 일단 바로 표시 → 로딩 문구가 거의 안 보임
  let hasCache = false;
  let cacheFresh = false;
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Array.isArray(cached.entries) && cached.entries.length) {
      applyEntries(cached.entries);
      hasCache = true;
      cacheFresh = Date.now() - cached.ts < CACHE_TTL;
    }
  } catch (_) {}

  if (!hasCache) setLoading();

  const fetchWithTimeout = (url, ms) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { cache: 'no-store', signal: ctrl.signal })
      .finally(() => clearTimeout(timer));
  };

  // 1순위: 자체 서버 API (Cloudflare Functions — 빠르고 CORS 문제 없음)
  const tryApi = async () => {
    const res = await fetchWithTimeout('/api/youtube', 6000);
    if (!res.ok) throw new Error('api');
    const data = await res.json();
    if (!data.entries || !data.entries.length) throw new Error('empty');
    return data.entries;
  };

  // 2순위: 공개 프록시들을 동시에 시도해서 가장 빨리 성공한 것 사용
  const tryProxy = async buildUrl => {
    const res = await fetchWithTimeout(buildUrl(RSS), 7000);
    if (!res.ok) throw new Error('proxy');
    const xml = await res.text();
    if (!xml || xml.length < 200) throw new Error('short');
    const entries = parseXML(xml);
    if (!entries.length) throw new Error('empty');
    return entries;
  };

  const loadFresh = async () => {
    try { return await tryApi(); } catch (_) {}
    try { return await Promise.any(PROXIES.map(tryProxy)); } catch (_) {}
    return null;
  };

  // 캐시가 신선하면 네트워크 요청 생략
  if (!cacheFresh) {
    loadFresh().then(entries => {
      if (entries) {
        applyEntries(entries);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), entries })); } catch (_) {}
      } else if (!hasCache) {
        const titleEl = document.getElementById('yt-title');
        if (titleEl) titleEl.textContent = '유튜브 채널에서 최신 설교를 확인하세요';
      }
    });
  }
})();

// Notice panel
const noticeBtn   = document.getElementById('notice-btn');
const noticeBtnMobile = document.getElementById('notice-btn-mobile');
const noticePanel = document.getElementById('notice-panel');
const noticeClose = document.getElementById('notice-close');
if (noticePanel && noticeClose) {
  const noticeTriggers = [noticeBtn, noticeBtnMobile].filter(Boolean);
  noticeTriggers.forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      noticePanel.classList.toggle('open');
    });
  });
  noticeClose.addEventListener('click', () => noticePanel.classList.remove('open'));
  document.addEventListener('click', e => {
    if (!noticePanel.contains(e.target) && !noticeTriggers.includes(e.target)) {
      noticePanel.classList.remove('open');
    }
  });
}

// 정다운문화센터 포스터 팝업
const posterModal = document.getElementById('poster-modal');
const posterModalImg = document.getElementById('poster-modal-img');
const posterModalClose = document.getElementById('poster-modal-close');
if (posterModal && posterModalImg && posterModalClose) {
  const openPosterModal = () => {
    if (!posterModalImg.src) posterModalImg.src = posterModalImg.dataset.src;
    posterModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closePosterModal = () => {
    posterModal.classList.remove('open');
    document.body.style.overflow = '';
  };
  document.querySelectorAll('[data-poster-trigger]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      openPosterModal();
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPosterModal();
      }
    });
  });
  posterModalClose.addEventListener('click', closePosterModal);
  posterModal.querySelectorAll('[data-poster-close]').forEach(el => el.addEventListener('click', closePosterModal));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && posterModal.classList.contains('open')) closePosterModal();
  });
}

// 계좌번호 복사 버튼
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy || '';
    const done = () => {
      const original = btn.innerHTML;
      btn.classList.add('copied');
      btn.textContent = '복사 완료';
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = original; }, 1500);
    };
    try {
      await navigator.clipboard.writeText(text);
      done();
    } catch (_) {
      // 클립보드 API가 막힌 환경 폴백
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (_) {}
      document.body.removeChild(ta);
    }
  });
});

