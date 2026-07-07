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
      grid.innerHTML = items.slice(0, 3).map(item => `
        <article class="news-card reveal visible">
          <div class="news-img"><img src="${escapeHtml(item.image || FALLBACK_IMG)}" alt="" loading="lazy" /></div>
          <div class="news-body">
            <span class="news-tag">${escapeHtml(item.tag || '소식')}</span>
            <h3 class="news-title">${escapeHtml(item.title || '')}</h3>
            ${item.body ? `<p class="news-summary">${escapeHtml(item.body)}</p>` : ''}
            <p class="news-date">${escapeHtml(fmtDate(item.date))}</p>
          </div>
        </article>
      `).join('');
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
        </li>
      `).join('');
    }
  }
})();
