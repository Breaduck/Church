// data/news.json 에서 교회소식을 읽어 홈 화면 카드 + 상단 공지 패널을 채움
// 관리자가 /admin/ 에서 news.json을 수정하면 배포 후 자동으로 반영됨
(async function loadNews() {
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

  const FALLBACK_IMG = '/img/church-misc.jpg';

  try {
    const res = await fetch(`/data/news.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const items = (data.items || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!items.length) return;

    if (grid) {
      grid.innerHTML = items.slice(0, 3).map(item => `
        <article class="news-card reveal visible">
          <div class="news-img"><img src="${escapeHtml(item.image || FALLBACK_IMG)}" alt="" loading="lazy" /></div>
          <div class="news-body">
            <span class="news-tag">${escapeHtml(item.tag || '소식')}</span>
            <h3 class="news-title">${escapeHtml(item.title || '')}</h3>
            <p class="news-date">${escapeHtml(fmtDate(item.date))}</p>
          </div>
        </article>
      `).join('');
    }

    if (noticeList) {
      noticeList.innerHTML = items.slice(0, 5).map(item => `
        <li class="notice-item">
          <span class="notice-item-date">${escapeHtml(fmtDate(item.date))}</span>
          <p class="notice-item-title">${escapeHtml(item.title || '')}</p>
        </li>
      `).join('');
    }
  } catch (_) {
    // 실패 시 HTML에 하드코딩된 fallback이 그대로 표시됨
  }
})();
