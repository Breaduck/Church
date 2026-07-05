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

// YouTube 최신 설교 자동 로드
(function loadYouTube() {
  const CHANNEL_ID = 'UCqLNxJF2KSSbqPnnVwB2deQ';
  const RSS = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
  const PROXY = `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS)}`;

  const fmt = iso => {
    const d = new Date(iso);
    return `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}`;
  };

  fetch(PROXY)
    .then(r => r.text())
    .then(xml => {
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const entries = [...doc.querySelectorAll('entry')].slice(0, 4);
      if (!entries.length) return;

      // 최신 영상 (첫 번째)
      const latest = entries[0];
      const videoId = latest.querySelector('videoId')?.textContent;
      const title   = latest.querySelector('title')?.textContent;
      const date    = latest.querySelector('published')?.textContent;
      const link    = `https://www.youtube.com/watch?v=${videoId}`;
      const thumb   = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

      const img = document.getElementById('yt-thumb-img');
      if (img && videoId) { img.src = thumb; }

      const ytLink = document.getElementById('yt-link');
      if (ytLink && link) ytLink.href = link;

      const ytTitle = document.getElementById('yt-title');
      if (ytTitle && title) ytTitle.textContent = title;

      const ytDate = document.getElementById('yt-date');
      if (ytDate && date) ytDate.textContent = fmt(date);

      // 이전 영상 3개 (2~4번째)
      const rows = document.querySelectorAll('#yt-prev-list .prev-row');
      entries.slice(1, 4).forEach((entry, i) => {
        if (!rows[i]) return;
        const vid   = entry.querySelector('videoId')?.textContent;
        const ttl   = entry.querySelector('title')?.textContent;
        const pub   = entry.querySelector('published')?.textContent;
        const d     = pub ? new Date(pub) : null;
        const label = d ? `${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}` : '—';
        rows[i].href = vid ? `https://www.youtube.com/watch?v=${vid}` : rows[i].href;
        const dateEl  = rows[i].querySelector('.prev-date');
        const titleEl = rows[i].querySelector('.prev-title');
        if (dateEl)  dateEl.textContent  = label;
        if (titleEl) titleEl.textContent = ttl || '—';
      });
    })
    .catch(() => {
      const ytDate = document.getElementById('yt-date');
      if (ytDate) ytDate.textContent = '';
    });
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
