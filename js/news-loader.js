// data/news.json → 홈 화면 '교회소식' 카드
// data/notices.json → 상단 '공지사항' 패널
// 관리자가 /admin/ 에서 편집한 뒤 배포되면 자동 반영됩니다.
(async function loadContent() {
  const grid = document.querySelector('.news-grid');
  const noticeList = document.querySelector('.notice-list');
  if (!grid && !noticeList) return;

  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const fmtDate = iso => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${m[1]}. ${m[2]}. ${m[3]}` : (iso || '');
  };

  const bust = () => `?t=${Date.now()}`;
  const FALLBACK_IMG = '/img/church-misc.jpg';

  async function fetchJson(path) {
    try {
      const res = await fetch(path + bust(), { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) { return null; }
  }

  // 교회소식 카드
  if (grid) {
    const data = await fetchJson('/data/news.json');
    const items = ((data && data.items) || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (items.length) {
      grid.innerHTML = items.slice(0, 3).map(item => {
        const img = `<img src="${escapeHtml(item.image || FALLBACK_IMG)}" alt="" loading="lazy" />`;
        const media = item.video
          ? `<a class="news-img news-img--video" href="${escapeHtml(item.video)}" target="_blank" rel="noopener noreferrer" aria-label="영상 보기">${img}<span class="news-play"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg></span></a>`
          : `<div class="news-img">${img}</div>`;
        return `
        <article class="news-card reveal visible">
          ${media}
          <div class="news-body">
            <span class="news-tag">${escapeHtml(item.tag || '소식')}</span>
            <h3 class="news-title">${escapeHtml(item.title || '')}</h3>
            ${item.body ? `<p class="news-summary">${escapeHtml(item.body)}</p>` : ''}
            <p class="news-date">${escapeHtml(fmtDate(item.date))}</p>
          </div>
        </article>
      `;
      }).join('');
    }
  }

  // 공지사항 패널
  if (noticeList) {
    const data = await fetchJson('/data/notices.json');
    const items = ((data && data.items) || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (items.length) {
      noticeList.innerHTML = items.slice(0, 8).map(item => `
        <li class="notice-item">
          <span class="notice-item-date">${escapeHtml(fmtDate(item.date))}</span>
          <p class="notice-item-title">${escapeHtml(item.title || '')}</p>
          ${item.image ? `<img class="notice-item-img" src="${escapeHtml(item.image)}" alt="" loading="lazy" />` : ''}
          ${item.body ? `<p class="notice-item-body">${escapeHtml(item.body)}</p>` : ''}
          ${item.video ? `<a class="notice-item-video" href="${escapeHtml(item.video)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5v14l11-7z"/></svg>영상 보기</a>` : ''}
        </li>
      `).join('');
    }
  }
})();
