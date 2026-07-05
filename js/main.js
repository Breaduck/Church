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

// YouTube 최신 설교 자동 로드 (localStorage 캐시로 즉시 표시)
(function loadYouTube() {
  const CHANNEL_ID = 'UCqLNxJF2KSSbqPnnVwB2deQ';
  const RSS   = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
  const PROXY = `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS)}`;
  const CACHE_KEY = 'yt_cache_v1';
  const CACHE_TTL = 3600000; // 1시간

  const fmt = iso => {
    const d = new Date(iso);
    return `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}`;
  };

  const applyEntries = entries => {
    if (!entries.length) return;
    const [first, ...rest] = entries;

    const img = document.getElementById('yt-thumb-img');
    if (img && first.videoId) img.src = `https://img.youtube.com/vi/${first.videoId}/mqdefault.jpg`;

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
      const label = d ? `${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}` : '—';
      const dateEl  = rows[i].querySelector('.prev-date');
      const titleEl = rows[i].querySelector('.prev-title');
      if (dateEl)  dateEl.textContent  = label;
      if (titleEl) titleEl.textContent = e.title || '—';
    });
  };

  // 캐시 먼저 적용 (즉시 표시)
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      applyEntries(cached.entries);
    }
  } catch (_) {}

  // 백그라운드에서 최신 데이터 fetch
  fetch(PROXY)
    .then(r => r.text())
    .then(xml => {
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const entries = [...doc.querySelectorAll('entry')].slice(0, 4).map(e => ({
        videoId: e.querySelector('videoId')?.textContent || '',
        title:   e.querySelector('title')?.textContent   || '',
        date:    e.querySelector('published')?.textContent || '',
      }));
      if (!entries.length) return;
      applyEntries(entries);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), entries })); } catch (_) {}
    })
    .catch(() => {});
})();

// Notice panel
const noticeBtn   = document.getElementById('notice-btn');
const noticePanel = document.getElementById('notice-panel');
const noticeClose = document.getElementById('notice-close');
if (noticeBtn && noticePanel && noticeClose) {
  noticeBtn.addEventListener('click', e => {
    e.stopPropagation();
    noticePanel.classList.toggle('open');
  });
  noticeClose.addEventListener('click', () => noticePanel.classList.remove('open'));
  document.addEventListener('click', e => {
    if (!noticePanel.contains(e.target) && e.target !== noticeBtn) {
      noticePanel.classList.remove('open');
    }
  });
}

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
